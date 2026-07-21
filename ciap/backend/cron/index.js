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
    const recentCounts = await datastore.table('FIR').query(
      `SELECT district_id, crime_type,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') AS hour_bucket,
              COUNT(*) AS count
       FROM FIR
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
       GROUP BY district_id, crime_type, hour_bucket
       ORDER BY hour_bucket DESC`
    ).catch(() => []);

    // Calculate z-score for each district-crimeType pair
    const grouped = {};
    for (const row of recentCounts) {
      const key = `${row.FIR.district_id}_${row.FIR.crime_type}`;
      if (!grouped[key]) grouped[key] = { districtId: row.FIR.district_id, crimeType: row.FIR.crime_type, counts: [] };
      grouped[key].counts.push(parseInt(row['COUNT(*)']));
    }

    const anomalies = [];
    for (const [key, data] of Object.entries(grouped)) {
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
      'SELECT district_id, name_en FROM District WHERE is_active = 1'
    ).catch(() => []);

    let updated = 0;
    for (const row of districts) {
      const districtId = row.District.district_id;

      // Fetch metrics for risk computation
      const [firCount, recidivism] = await Promise.all([
        datastore.table('FIR').query(
          `SELECT COUNT(*) AS cnt, SUM(CASE WHEN severity IN ('critical','high') THEN 1 ELSE 0 END) AS severe
           FROM FIR WHERE district_id = ${districtId}
           AND incident_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
        ).catch(() => []),
        datastore.table('CriminalFIR').query(
          `SELECT COUNT(*) AS cnt FROM CriminalFIR cf
           JOIN FIR f ON cf.fir_id = f.fir_id
           WHERE f.district_id = ${districtId}
           AND f.incident_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
        ).catch(() => []),
      ]);

      const total    = parseInt(firCount[0]?.['COUNT(*)'] || 0);
      const severe   = parseInt(firCount[0]?.['SUM(...)'] || 0);
      const recidiCount = parseInt(recidivism[0]?.['COUNT(*)'] || 0);

      // Simplified scoring formula (production would use ML model)
      const crimeRateScore    = Math.min(100, Math.round(total / 5));
      const recidivismScore   = Math.min(100, Math.round(recidiCount * 3));
      const socioScore        = 50; // Would come from external data source
      const infraScore        = 40;
      const overallScore      = Math.round(crimeRateScore * 0.4 + recidivismScore * 0.2 + socioScore * 0.25 + infraScore * 0.15);
      const riskLevel         = overallScore >= 65 ? 'critical' : overallScore >= 50 ? 'high' : overallScore >= 40 ? 'medium' : 'low';

      await datastore.table('RiskScore').insertRow({
        district_id:          districtId,
        overall_score:        overallScore,
        risk_level:           riskLevel,
        crime_rate_score:     crimeRateScore,
        recidivism_score:     recidivismScore,
        socioeconomic_score:  socioScore,
        infrastructure_score: infraScore,
        trend:                'stable',
        computed_at:          new Date().toISOString(),
        valid_until:          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
 * Schedule: 0 */6 * * * (every 6 hours)
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
 * Cron 5: Stale Alert Cleanup
 * Schedule: 0 3 * * * (daily at 3 AM)
 */
module.exports.cleanupStaleAlerts = async (context) => {
  const catalyst  = require('catalyst-sdk');
  const datastore = catalyst.datastore();

  console.log('[CRON] Cleaning up stale alerts...');

  try {
    // Auto-resolve alerts that have been acknowledged > 72 hours ago
    const result = await datastore.table('Alert').query(
      `SELECT alert_id FROM Alert
       WHERE status = 'acknowledged'
       AND acknowledged_at < DATE_SUB(NOW(), INTERVAL 72 HOUR)`
    ).catch(() => []);

    let resolved = 0;
    for (const row of result) {
      await datastore.table('Alert').updateRow({
        alert_id:    row.Alert.alert_id,
        status:      'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: 0, // System auto-resolve
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
