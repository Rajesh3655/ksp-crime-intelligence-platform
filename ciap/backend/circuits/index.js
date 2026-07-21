// ============================================================
// Catalyst Circuits — Event-Driven Workflows
// KSP CIAP Platform
// ============================================================

/**
 * Circuit 1: New High-Severity FIR Workflow
 * Trigger: Signal 'NEW_HIGH_SEVERITY_FIR'
 * Flow: FIR created → Create Alert → Notify → Assign Officer
 */
module.exports.newHighSeverityFIR = async (context, args) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();
  const mail      = catalyst.mail();
  const push      = catalyst.push();

  const { firId, severity, districtId, crimeType, timestamp } = args;

  try {
    // Step 1: Create Alert in DataStore
    const alert = await datastore.table('Alert').insertRow({
      alert_type:     `New ${severity.toUpperCase()} FIR`,
      severity,
      district_id:    districtId,
      fir_id:         firId,
      message:        `New ${severity} crime reported: ${crimeType}. Immediate review required.`,
      message_kn:     `ಹೊಸ ${severity} ಅಪರಾಧ ವರದಿ: ${crimeType}. ತಕ್ಷಣದ ಪರಿಶೀಲನೆ ಅಗತ್ಯ.`,
      status:         'active',
      trigger_source: 'Catalyst Signals',
    });

    // Step 2: Find district officer to notify
    const officers = await datastore.table('Users').query(
      `SELECT * FROM Users WHERE district_id = ${districtId} AND role IN ('district_officer', 'station_officer') AND status = 'active' LIMIT 3`
    );

    // Step 3: Send push notifications and emails
    for (const row of officers) {
      const officer = row.Users;
      try {
        await push.send({
          to:      officer.user_id.toString(),
          title:   `🚨 ${severity.toUpperCase()} Alert — New FIR`,
          message: `${crimeType} reported. FIR #${firId}. Immediate action required.`,
          data:    { alertId: alert.alert_id, firId, type: 'NEW_HIGH_SEVERITY_FIR' },
        });

        await mail.send({
          from:    'alerts@ciap.ksp.gov.in',
          to:      officer.email,
          subject: `[CIAP ALERT] ${severity.toUpperCase()} — New FIR #${firId}`,
          html: `
            <p>Dear ${officer.full_name},</p>
            <p>A new <strong>${severity}</strong> severity FIR has been registered.</p>
            <ul>
              <li><strong>FIR ID:</strong> ${firId}</li>
              <li><strong>Crime Type:</strong> ${crimeType}</li>
              <li><strong>Time:</strong> ${timestamp}</li>
            </ul>
            <p>Please log in to <a href="https://ciap.ksp.gov.in">CIAP</a> to take action.</p>
            <p><small>This is an automated alert from KSP CIAP.</small></p>
          `,
        });
      } catch (notifErr) {
        console.error(`Notification failed for officer ${officer.user_id}:`, notifErr.message);
      }
    }

    context.output = {
      success: true, alertId: alert.alert_id, notified: officers.length,
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
  const push      = catalyst.push();

  const { districtId, crimeType, zScore, observedCount, expectedCount, detectedAt } = args;

  const severity  = zScore >= 4 ? 'critical' : zScore >= 3 ? 'high' : 'medium';
  const message   = `Anomaly detected: ${crimeType} incidents at ${observedCount} vs expected ${expectedCount} (z=${zScore.toFixed(2)}σ). District ID ${districtId}.`;
  const messageKn = `ಅಸಂಗತ ಪತ್ತೆ: ${crimeType} ಘಟನೆಗಳು ${observedCount} ನಿರೀಕ್ಷಿತ ${expectedCount} ವಿರುದ್ಧ.`;

  try {
    // Create anomaly record in NoSQL
    const nosql = catalyst.nosql();
    await nosql.collection('AnomalyEvent').insert({
      anomaly_id:      require('uuid').v4(),
      detected_at:     detectedAt,
      district_id:     districtId,
      crime_type:      crimeType,
      metric:          'incident_count_daily',
      observed_value:  observedCount,
      expected_value:  expectedCount,
      z_score:         zScore,
      sigma_threshold: 3,
      alert_triggered: true,
      explanation:     message,
      status:          'new',
    });

    // Create alert
    const alert = await datastore.table('Alert').insertRow({
      alert_type:     'Crime Spike Anomaly',
      severity,
      district_id:    districtId,
      message,
      message_kn:     messageKn,
      status:         'active',
      trigger_source: 'Zia AutoML Anomaly Detection',
    });

    context.output = { success: true, alertId: alert.alert_id, severity };
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
  await nosql.collection('CCTNSSyncLog').insert({
    sync_id:    syncId,
    sync_type:  syncType,
    started_at: startedAt,
    status:     'running',
    triggered_by: args.triggeredBy || 'signal',
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
        // Upsert into DataStore
        const existing = await datastore.table('FIR').query(
          `SELECT fir_id FROM FIR WHERE fir_number = '${fir.fir_no}' LIMIT 1`
        );
        if (existing?.length) {
          await datastore.table('FIR').updateRow({ fir_id: existing[0].FIR.fir_id, status: fir.status });
          stats.updated++;
        } else {
          await datastore.table('FIR').insertRow({
            fir_number:    fir.fir_no,
            crime_type:    fir.crime_type,
            crime_category:fir.crime_category,
            severity:      fir.severity || 'medium',
            status:        fir.status || 'open',
            incident_date: fir.incident_date,
            description:   fir.description,
            created_by:    1, // System user
          });
          stats.inserted++;
        }
      } catch (e) {
        stats.failed++;
        console.error(`Failed to sync FIR ${fir.fir_no}:`, e.message);
      }
    }

    // Update sync log
    await nosql.collection('CCTNSSyncLog').update(syncId, {
      completed_at:      new Date().toISOString(),
      status:            stats.failed > 0 ? 'partial' : 'completed',
      records_fetched:   stats.fetched,
      records_inserted:  stats.inserted,
      records_updated:   stats.updated,
      records_failed:    stats.failed,
    });

    context.output = { success: true, syncId, ...stats };

  } catch (err) {
    await nosql.collection('CCTNSSyncLog').update(syncId, {
      status:     'failed',
      errors:     [{ message: err.message }],
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
      if (!record.fir_number || !record.crime_type) {
        errors.push({ record: record.fir_number || 'unknown', error: 'Missing required fields' });
        failed++;
        continue;
      }

      await datastore.table('FIR').insertRow({
        fir_number:    record.fir_number,
        crime_type:    record.crime_type,
        crime_category:record.crime_category || record.crime_type,
        severity:      ['critical','high','medium','low'].includes(record.severity) ? record.severity : 'medium',
        status:        ['open','pending','closed'].includes(record.status) ? record.status : 'open',
        incident_date: record.incident_date,
        description:   record.description || '',
        lat:           record.lat ? parseFloat(record.lat) : null,
        lng:           record.lng ? parseFloat(record.lng) : null,
        created_by:    1,
      });
      processed++;
    } catch (e) {
      errors.push({ record: record.fir_number, error: e.message });
      failed++;
    }
  }

  // Update batch status
  await datastore.table('IngestionBatch').updateRow({
    batch_id:          batchId,
    status:            failed > 0 ? (processed > 0 ? 'completed' : 'failed') : 'completed',
    processed_records: processed,
    failed_records:    failed,
    error_log:         JSON.stringify(errors.slice(0, 50)),
    completed_at:      new Date().toISOString(),
  }).catch(() => {});

  context.output = { success: true, batchId, processed, failed, errors: errors.slice(0, 10) };
};
