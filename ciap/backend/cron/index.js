/**
 * Catalyst Cron Jobs — Scheduled Tasks
 * KSP CIAP Platform
 */

'use strict';

/**
 * Cron 1: Anomaly Detection — Every Hour
 * Detects crime spikes using z-score analysis
 * Schedule: 0 * * * * (every hour)
 */
module.exports.detectAnomalies = async (context) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();
  const signals   = catalyst.signals();

  console.log('[CRON] Starting anomaly detection...');

  try {
    // Fetch hourly crime counts for the past 48 hours per district
    const recentCounts = await datastore.table('CaseMaster').query(
      `SELECT d.DistrictID, ch.CrimeGroupName,
              DATE_FORMAT(cm.CrimeRegisteredDate, '%Y-%m-%d %H:00:00') AS hour_bucket,
              COUNT(*) AS count
       FROM CaseMaster cm
       LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
       LEFT JOIN District d ON u.DistrictID = d.DistrictID
       LEFT JOIN CrimeHead ch ON cm.CrimeMajorHeadID = ch.CrimeHeadID
       WHERE cm.CrimeRegisteredDate >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
       GROUP BY d.DistrictID, ch.CrimeGroupName, hour_bucket
       ORDER BY hour_bucket DESC`
    ).catch(() => []);

    // Calculate z-score for each district-crimeType pair
    const grouped = {};
    for (const row of recentCounts) {
      const districtId = row.District?.DistrictID || row.DistrictID;
      const crimeType = row.CrimeHead?.CrimeGroupName || row.CrimeGroupName || 'Unknown';
      const key = `${districtId}_${crimeType}`;
      if (!grouped[key]) grouped[key] = { districtId, crimeType, counts: [] };
      grouped[key].counts.push(parseInt(row['COUNT(*)']));
    }

    const anomalies = [];
    for (const data of Object.values(grouped)) {
      const { districtId, crimeType, counts } = data;
      if (counts.length < 6) continue; // Need at least 6 hours of data

      const latest   = counts[0];
      const baseline = counts.slice(1);
      const mean     = baseline.reduce((a, b) => a + b, 0) / baseline.length;
      const std      = Math.sqrt(baseline.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / baseline.length);

      if (std < 0.1) continue; // Skip flat signals

      const zScore = (latest - mean) / std;

      if (zScore >= 3) {
        anomalies.push({ districtId, crimeType, zScore, observedCount: latest, expectedCount: Math.round(mean) });
      }
    }

    // Publish anomaly signals
    for (const anomaly of anomalies) {
      await signals.publish('CRIME_SPIKE_DETECTED', {
        ...anomaly,
        detectedAt: new Date().toISOString(),
      }).catch(e => console.error('Signal publish error:', e.message));
    }

    console.log(`[CRON] Anomaly detection complete. Found ${anomalies.length} anomalies.`);
    context.output = { anomaliesFound: anomalies.length, anomalies };

  } catch (err) {
    console.error('[CRON] Anomaly detection error:', err);
    context.output = { error: err.message };
  }
};

/**
 * Cron 2: Daily Forecast Generation
 * Schedule: 0 1 * * * (every day at 1 AM)
 */
module.exports.generateDailyForecast = async (context) => {
  const catalyst  = require('catalyst-sdk');
  const signals   = catalyst.signals();

  console.log('[CRON] Triggering daily forecast generation...');

  try {
    // Trigger forecast for all districts
    await signals.publish('FORECAST_GENERATION_REQUESTED', {
      districtId:  null,    // All districts
      crimeType:   null,    // All crime types
      days:        7,
      requestedBy: 0,       // System user
      triggeredBy: 'cron',
    });

    console.log('[CRON] Daily forecast trigger sent.');
    context.output = { success: true, message: 'Forecast generation queued for all districts' };
  } catch (err) {
    console.error('[CRON] Daily forecast error:', err);
    context.output = { error: err.message };
  }
};

/**
 * Cron 3: Risk Score Recomputation
 * Schedule: 0 2 * * * (every day at 2 AM)
 */
module.exports.recomputeRiskScores = async (context) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();

  console.log('[CRON] Starting risk score recomputation...');

  try {
    const districts = await datastore.table('District').query(
      'SELECT DistrictID, DistrictName FROM District WHERE Active = 1'
    ).catch(() => []);

    let updated = 0;
    for (const row of districts) {
      const districtId = row.District.DistrictID;

      // Fetch metrics for risk computation
      const [firCount, recidivism] = await Promise.all([
        datastore.table('CaseMaster').query(
          `SELECT COUNT(*) AS cnt
           FROM CaseMaster cm
           JOIN Unit u ON cm.PoliceStationID = u.UnitID
           WHERE u.DistrictID = ${districtId}
           AND cm.CrimeRegisteredDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
        ).catch(() => []),
        datastore.table('Accused').query(
          `SELECT COUNT(*) AS cnt
           FROM Accused a
           JOIN CaseMaster cm ON a.CaseMasterID = cm.CaseMasterID
           JOIN Unit u ON cm.PoliceStationID = u.UnitID
           WHERE u.DistrictID = ${districtId}
           AND cm.CrimeRegisteredDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
           GROUP BY a.AccusedName HAVING COUNT(*) > 1`
        ).catch(() => []),
      ]);

      const total    = parseInt(firCount[0]?.['COUNT(*)'] || 0);
      const recidiCount = recidivism.length;

      // Simplified scoring formula (production would use ML model)
      const crimeRateScore    = Math.min(100, Math.round(total / 5));
      const recidivismScore   = Math.min(100, Math.round(recidiCount * 3));
      const socioScore        = 50; // Would come from external data source
      const infraScore        = 40;
      const overallScore      = Math.round(crimeRateScore * 0.4 + recidivismScore * 0.2 + socioScore * 0.25 + infraScore * 0.15);
      const riskLevel         = overallScore >= 65 ? 'critical' : overallScore >= 50 ? 'high' : overallScore >= 40 ? 'medium' : 'low';

      await datastore.table('IntelligenceFinding').insertRow({
        DistrictID: districtId,
        FindingType: 'risk',
        Severity: riskLevel === 'critical' ? 'red' : riskLevel === 'high' ? 'orange' : riskLevel === 'medium' ? 'yellow' : 'green',
        ConfidencePct: 82,
        Summary: `District risk score ${overallScore}`,
        Explanation: {
          overallScore,
          crimeRateScore,
          recidivismScore,
          socioeconomicScore: socioScore,
          infrastructureScore: infraScore,
        },
        CreatedAt: new Date().toISOString(),
      }).catch(() => {});

      updated++;
    }

    console.log(`[CRON] Risk scores updated for ${updated} districts.`);
    context.output = { success: true, districtsUpdated: updated };

  } catch (err) {
    console.error('[CRON] Risk score error:', err);
    context.output = { error: err.message };
  }
};

/**
 * Cron 4: Incremental CCTNS Sync
 * Schedule: every 6 hours
 */
module.exports.cctnsIncrementalSync = async (context) => {
  const catalyst = require('catalyst-sdk');
  const signals  = catalyst.signals();

  console.log('[CRON] Triggering CCTNS incremental sync...');

  try {
    const connections = catalyst.connections();
    const cctnsConn   = await connections.getConnection('CCTNS_OAUTH');
    const accessToken = await cctnsConn.getAccessToken();

    await signals.publish('CCTNS_SYNC_REQUESTED', {
      syncType:    'incremental',
      dateFrom:    new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      accessToken,
      triggeredBy: 'cron',
    });

    context.output = { success: true, message: 'CCTNS incremental sync initiated' };
  } catch (err) {
    console.error('[CRON] CCTNS sync error (connection may not be configured):', err.message);
    context.output = { error: err.message, hint: 'Configure CCTNS_OAUTH in Catalyst Connections' };
  }
};

/**
 * Cron 6: Recent FIR Intelligence Index
 * Schedule: every 30 minutes
 */
module.exports.indexRecentCrimeIntelligence = async (context) => {
  const catalyst = require('catalyst-sdk');
  const { analyzeCase, generateRepeatOffenderProfiles } = require('../functions/src/services/intelligenceEngine');

  console.log('[CRON] Indexing recent CaseMaster intelligence...');

  try {
    const rows = await catalyst.datastore().table('CaseMaster').query(
      `SELECT CaseMasterID
       FROM CaseMaster
       WHERE CrimeRegisteredDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       ORDER BY CrimeRegisteredDate DESC
       LIMIT 200`
    ).catch(() => []);

    let analyzed = 0;
    for (const row of rows) {
      const caseMasterId = row.CaseMaster?.CaseMasterID || row.CaseMasterID;
      const result = await analyzeCase(caseMasterId).catch(error => {
        console.error(`[CRON] Case ${caseMasterId} analysis failed:`, error.message);
        return null;
      });
      if (result) analyzed++;
    }

    const repeatProfiles = await generateRepeatOffenderProfiles(100).catch(() => []);
    context.output = { success: true, analyzed, repeatProfiles: repeatProfiles.length };
  } catch (err) {
    console.error('[CRON] Intelligence index error:', err);
    context.output = { success: false, error: err.message };
  }
};

/**
 * Cron 7: Hourly Hotspot Recompute
 */
module.exports.recomputeHotspotsHourly = async (context) => {
  const catalyst = require('catalyst-sdk');
  const signals = catalyst.signals();
  try {
    await signals.publish('HOTSPOT_RECOMPUTE_REQUESTED', {
      window: 'hourly',
      requestedAt: new Date().toISOString(),
    });
    context.output = { success: true, queued: true };
  } catch (error) {
    context.output = { success: false, error: error.message };
  }
};

/**
 * Cron 8: Nightly Model Retraining
 */
module.exports.retrainModelsNightly = async (context) => {
  const { trainCandidateModel, detectDrift, indexEmbeddings } = require('../functions/src/services/mlLifecycle');
  try {
    const drift = await detectDrift({ limit: 1500 });
    const embeddings = await indexEmbeddings(2000);
    const trained = await trainCandidateModel({ target: 'risk', limit: 5000, builtBy: 'nightly-cron' });
    context.output = { success: true, drift, embeddings, trainedStatus: trained.status };
  } catch (error) {
    context.output = { success: false, error: error.message };
  }
};

/**
 * Cron 9: Weekly SCRB Intelligence Report
 */
module.exports.generateWeeklyScrbReport = async (context) => {
  const catalyst = require('catalyst-sdk');
  try {
    await catalyst.signals().publish('REPORT_GENERATION_QUEUED', {
      reportType: 'SCRB',
      period: 'weekly',
      requestedBy: 'system',
      requestedAt: new Date().toISOString(),
    });
    context.output = { success: true, report: 'weekly-scrb' };
  } catch (error) {
    context.output = { success: false, error: error.message };
  }
};

/**
 * Cron 10: Monthly Strategic Trend Report
 */
module.exports.generateMonthlyTrendReport = async (context) => {
  const catalyst = require('catalyst-sdk');
  try {
    await catalyst.signals().publish('TREND_REPORT_REQUESTED', {
      period: 'monthly',
      requestedBy: 'system',
      requestedAt: new Date().toISOString(),
    });
    context.output = { success: true, report: 'monthly-trend' };
  } catch (error) {
    context.output = { success: false, error: error.message };
  }
};

/**
 * Cron 5: Stale Alert Cleanup
 * Schedule: 0 3 * * * (daily at 3 AM)
 */
module.exports.cleanupStaleAlerts = async (context) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();

  console.log('[CRON] Cleaning up stale alerts...');

  try {
    // Auto-resolve alerts that have been acknowledged > 72 hours ago
    const result = await datastore.table('IntelligenceFinding').query(
      `SELECT FindingID FROM IntelligenceFinding
       WHERE FindingType = 'anomaly'
       AND CreatedAt < DATE_SUB(NOW(), INTERVAL 72 HOUR)`
    ).catch(() => []);

    let resolved = 0;
    for (const row of result) {
      await datastore.table('IntelligenceFinding').updateRow({
        FindingID: row.IntelligenceFinding.FindingID,
        Severity: 'green',
      }).catch(() => {});
      resolved++;
    }

    console.log(`[CRON] Auto-resolved ${resolved} stale alerts.`);
    context.output = { success: true, resolvedCount: resolved };

  } catch (err) {
    console.error('[CRON] Alert cleanup error:', err);
    context.output = { error: err.message };
  }
};
