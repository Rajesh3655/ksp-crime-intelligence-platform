// ============================================================
// Catalyst Circuits — Event-Driven Workflows
// KSP CIAP Platform
// ============================================================

/**
 * Circuit 1: New High-Severity CaseMaster Workflow
 * Trigger: Signal 'NEW_HIGH_SEVERITY_FIR'
 * Flow: FIR created → Create Alert → Notify → Assign Officer
 */
module.exports.newHighSeverityFIR = async (context, args) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();
  const push      = catalyst.push();
  const { analyzeCase } = require('../functions/src/services/intelligenceEngine');

  const { caseMasterId, crimeNo, severity = 'high', districtId, crimeType, timestamp } = args;

  try {
    const finding = await datastore.table('IntelligenceFinding').insertRow({
      CaseMasterID: caseMasterId,
      DistrictID: districtId,
      FindingType: 'alert',
      Severity: severity === 'critical' ? 'red' : 'orange',
      ConfidencePct: 95,
      Summary: `New high-severity CaseMaster record ${crimeNo || caseMasterId}: ${crimeType}`,
      Explanation: { crimeNo, crimeType, timestamp, triggerSource: 'Catalyst Signals' },
      SupportingCases: [caseMasterId],
    });

    if (caseMasterId) {
      await analyzeCase(caseMasterId).catch(error => {
        console.error('Automatic intelligence analysis failed:', error.message);
      });
    }

    await push.send({
      title: `${severity.toUpperCase()} Intelligence Alert`,
      message: `${crimeType} reported. Case ${crimeNo || caseMasterId}. Review in CIAP.`,
      data: { findingId: finding.FindingID, caseMasterId, type: 'NEW_HIGH_SEVERITY_CASE' },
    }).catch(e => console.error('Push notification failed:', e.message));

    context.output = {
      success: true, findingId: finding.FindingID,
    };
  } catch (err) {
    console.error('Circuit newHighSeverityFIR error:', err);
    context.output = { success: false, error: err.message };
  }
};

/**
 * Circuit 2: Anomaly Detection → Alert Creation
 * Trigger: Signal 'CRIME_SPIKE_DETECTED'
 */
module.exports.crimeSpike = async (context, args) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();

  const { districtId, crimeType, zScore, observedCount, expectedCount, detectedAt } = args;

  const severity  = zScore >= 4 ? 'critical' : zScore >= 3 ? 'high' : 'medium';
  const message   = `Anomaly detected: ${crimeType} incidents at ${observedCount} vs expected ${expectedCount} (z=${zScore.toFixed(2)}σ). District ID ${districtId}.`;
  const messageKn = `ಅಸಂಗತ ಪತ್ತೆ: ${crimeType} ಘಟನೆಗಳು ${observedCount} ನಿರೀಕ್ಷಿತ ${expectedCount} ವಿರುದ್ಧ.`;

  try {
    // Queue anomaly signal in NoSQL
    const nosql = catalyst.nosql();
    await nosql.collection('SignalInbox').insert({
      signal_id: require('uuid').v4(),
      source: 'anomaly',
      priority: severity,
      payload: { districtId, crimeType, zScore, observedCount, expectedCount, detectedAt },
      status: 'received',
      received_at: detectedAt,
    });

    const finding = await datastore.table('IntelligenceFinding').insertRow({
      DistrictID: districtId,
      FindingType: 'anomaly',
      Severity: severity === 'critical' ? 'red' : severity === 'high' ? 'orange' : 'yellow',
      ConfidencePct: Math.min(99, Math.round(zScore * 25)),
      Summary: message,
      Explanation: { messageKn, crimeType, zScore, observedCount, expectedCount, detectedAt },
    });

    context.output = { success: true, findingId: finding.FindingID, severity };
  } catch (err) {
    console.error('Circuit crimeSpike error:', err);
    context.output = { success: false, error: err.message };
  }
};

/**
 * Circuit 3: CCTNS Data Sync
 * Trigger: Signal 'CCTNS_SYNC_REQUESTED' or Cron
 */
module.exports.cctnsSync = async (context, args) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();
  const { v4: uuidv4 } = require('uuid');
  const axios     = require('axios');

  const { syncType = 'incremental', accessToken, districtId, dateFrom } = args;
  const syncId = uuidv4();
  const startedAt = new Date().toISOString();

  // Create sync log
  const nosql = catalyst.nosql();
  await nosql.collection('SignalInbox').insert({
    signal_id: syncId,
    source: 'fir',
    priority: 'medium',
    payload: { syncType, districtId, dateFrom, startedAt, triggeredBy: args.triggeredBy || 'signal' },
    status: 'processing',
    received_at: startedAt,
  });

  let stats = { fetched: 0, inserted: 0, updated: 0, failed: 0 };

  try {
    const CCTNS_BASE_URL = process.env.CCTNS_API_URL || 'https://cctns.gov.in/api/v1';
    const params = { syncType, districtId, from: dateFrom, limit: 500 };

    const response = await axios.get(`${CCTNS_BASE_URL}/firs`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
      timeout: 30000,
    });

    const firs = response.data?.data || [];
    stats.fetched = firs.length;

    for (const fir of firs) {
      try {
        await datastore.table('IntelligenceFinding').insertRow({
          FindingType: 'pattern',
          Severity: 'yellow',
          ConfidencePct: 75,
          Summary: `CCTNS sync candidate received for ${fir.fir_no}`,
          Explanation: { source: 'CCTNS', record: fir },
          CreatedAt: new Date().toISOString(),
        });
        stats.inserted++;
      } catch (e) {
        stats.failed++;
        console.error(`Failed to sync FIR ${fir.fir_no}:`, e.message);
      }
    }

    // Update sync log
    await nosql.collection('SignalInbox').update(syncId, {
      processed_at: new Date().toISOString(),
      status: stats.failed > 0 ? 'completed' : 'completed',
      payload: { syncType, districtId, dateFrom, ...stats },
    });

    context.output = { success: true, syncId, ...stats };

  } catch (err) {
    await nosql.collection('SignalInbox').update(syncId, {
      status: 'failed',
      error_message: err.message,
    }).catch(() => {});

    context.output = { success: false, syncId, error: err.message };
  }
};

/**
 * Circuit 4: Ingestion Batch Processor
 * Trigger: Signal 'INGESTION_BATCH_READY'
 */
module.exports.processBatch = async (context, args) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();

  const { batchId, records, source } = args;
  let processed = 0, failed = 0;
  const errors = [];

  for (const record of (records || [])) {
    try {
      if (!record.CaseMasterID && !record.CrimeNo) {
        errors.push({ record: record.CrimeNo || 'unknown', error: 'Missing CaseMasterID or CrimeNo' });
        failed++;
        continue;
      }

      await datastore.table('IntelligenceFinding').insertRow({
        CaseMasterID: record.CaseMasterID || null,
        FindingType: 'pattern',
        Severity: 'yellow',
        ConfidencePct: 70,
        Summary: `Ingestion review candidate ${record.CrimeNo || record.CaseMasterID}`,
        Explanation: { source, record },
        SupportingCases: record.CaseMasterID ? [record.CaseMasterID] : [],
      });
      processed++;
    } catch (e) {
      errors.push({ record: record.fir_number, error: e.message });
      failed++;
    }
  }

  // Update batch status
  await datastore.table('IntelligenceFinding').insertRow({
    FindingType: 'pattern',
    Severity: failed > 0 ? 'orange' : 'green',
    ConfidencePct: 80,
    Summary: `Ingestion batch ${batchId} processed ${processed} records with ${failed} failures`,
    Explanation: { batchId, source, processed, failed, errors: errors.slice(0, 50) },
  }).catch(() => {});

  context.output = { success: true, batchId, processed, failed, errors: errors.slice(0, 10) };
};

/**
 * Circuit 5: Full Intelligence Pipeline
 * New/updated FIR -> features -> risk -> graph -> prediction -> offender/gang -> notification -> SCRB update.
 */
module.exports.intelligencePipeline = async (context, args) => {
  const catalyst = require('catalyst-sdk');
  const { analyzeCase, generateRepeatOffenderProfiles } = require('../functions/src/services/intelligenceEngine');
  const { caseMasterId, eventType = 'NEW_FIR' } = args;

  try {
    const analysis = await analyzeCase(caseMasterId);
    if (!analysis) throw new Error(`CaseMaster ${caseMasterId} not found`);

    const repeatProfiles = await generateRepeatOffenderProfiles(50);
    const highRisk = analysis.intelligence.scores.riskScore >= 70;
    if (highRisk) {
      await catalyst.push().send({
        title: 'Critical Intelligence',
        message: `Case ${analysis.intelligence.crime_no || caseMasterId} risk ${analysis.intelligence.scores.riskScore}/100`,
        data: { caseMasterId, eventType, route: '/link-analysis' },
      }).catch(error => console.error('Push failed:', error.message));
    }

    await catalyst.signals().publish('SCRB_INTELLIGENCE_UPDATED', {
      caseMasterId,
      eventType,
      riskScore: analysis.intelligence.scores.riskScore,
      repeatProfiles: repeatProfiles.length,
      updatedAt: new Date().toISOString(),
    }).catch(error => console.error('SCRB signal failed:', error.message));

    context.output = {
      success: true,
      caseMasterId,
      riskScore: analysis.intelligence.scores.riskScore,
      graphId: analysis.graph.graph_id,
      repeatProfiles: repeatProfiles.length,
      notified: highRisk,
    };
  } catch (error) {
    console.error('Circuit intelligencePipeline error:', error);
    context.output = { success: false, retryable: true, error: error.message };
  }
};

/**
 * Circuit 6: Drift Approval Workflow
 * Drift detected -> candidate training -> shadow comparison -> promotion recommendation.
 */
module.exports.driftApprovalWorkflow = async (context, args) => {
  const catalyst = require('catalyst-sdk');
  const { trainCandidateModel } = require('../functions/src/services/mlLifecycle');
  const { events = [] } = args;

  try {
    const candidate = await trainCandidateModel({ target: 'risk', limit: 5000, builtBy: 'drift-circuit' });
    await catalyst.signals().publish('MODEL_APPROVAL_REQUIRED', {
      driftEvents: events,
      candidateModel: candidate.model,
      dataset: candidate.dataset?.datasetVersion,
      requestedAt: new Date().toISOString(),
    }).catch(() => {});
    context.output = { success: true, candidateStatus: candidate.status, approvalQueued: true };
  } catch (error) {
    context.output = { success: false, retryable: true, error: error.message };
  }
};
