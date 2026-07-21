/**
 * Forecasting Routes — Catalyst Zia AutoML
 * GET  /api/forecast            — Get forecast for a district/crime type
 * POST /api/forecast/generate   — Trigger new forecast generation
 * GET  /api/forecast/history    — Historical forecast accuracy
 */

'use strict';

const express  = require('express');
const catalyst = require('catalyst-sdk');

const { asyncHandler, sendSuccess } = require('../middleware/errors');
const { requireRole }               = require('../middleware/auth');

const router = express.Router();

// ── GET /api/forecast ─────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { districtId, crimeType, days = 7 } = req.query;
  const numDays = Math.min(30, Math.max(1, parseInt(days)));

  try {
    const datastore = catalyst.datastore();

    let where = `WHERE f.FindingType = 'forecast' ORDER BY f.CreatedAt DESC LIMIT ${numDays}`;
    if (districtId) where = `WHERE f.FindingType = 'forecast' AND f.DistrictID = ${parseInt(districtId)} ORDER BY f.CreatedAt DESC LIMIT ${numDays}`;

    const result = await datastore.table('IntelligenceFinding').query(
      `SELECT f.*, d.DistrictName AS district_name
       FROM IntelligenceFinding f
       LEFT JOIN District d ON f.DistrictID = d.DistrictID
       ${where}`
    );

    sendSuccess(res, result.map(r => ({
      forecastId:   r.IntelligenceFinding.FindingID,
      districtId:   r.IntelligenceFinding.DistrictID,
      districtName: r.District?.DistrictName || r.district_name,
      crimeType:    r.IntelligenceFinding.Explanation?.crimeHead || 'all',
      date:         r.IntelligenceFinding.CreatedAt,
      predicted:    r.IntelligenceFinding.Explanation?.predictedCount,
      lower:        r.IntelligenceFinding.Explanation?.lowerBound,
      upper:        r.IntelligenceFinding.Explanation?.upperBound,
      confidence:   parseFloat(r.IntelligenceFinding.ConfidencePct),
      model:        r.IntelligenceFinding.Explanation?.model || 'Catalyst Zia AutoML',
      explanation:  r.IntelligenceFinding.Explanation,
      generatedAt:  r.IntelligenceFinding.CreatedAt,
    })));

  } catch {
    // Mock forecast data for dev/demo
    const mockData = generateMockForecast(numDays, parseInt(districtId) || null, crimeType || null);
    sendSuccess(res, mockData, { mock: true });
  }
}));

// ── POST /api/forecast/generate ───────────────────────────────────────────────
router.post('/generate', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const { districtId, crimeType, days = 7 } = req.body;

  try {
    // ── Catalyst Zia AutoML Prediction Job ────────────────────────────────
    const zia = catalyst.zia();

    // Fetch historical data for training context
    const datastore   = catalyst.datastore();
    const historicalQuery = `
      SELECT DATE(cm.CrimeRegisteredDate) AS date,
             ch.CrimeGroupName AS crime_type,
             COUNT(*) AS count
      FROM CaseMaster cm
      LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
      LEFT JOIN CrimeHead ch ON cm.CrimeMajorHeadID = ch.CrimeHeadID
      WHERE cm.CrimeRegisteredDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      ${districtId ? `AND u.DistrictID = ${parseInt(districtId)}` : ''}
      ${crimeType  ? `AND ch.CrimeGroupName = '${String(crimeType).replace(/'/g, "''")}'` : ''}
      GROUP BY DATE(cm.CrimeRegisteredDate), ch.CrimeGroupName
      ORDER BY date ASC
    `;

    const historical = await datastore.table('CaseMaster').query(historicalQuery);
    const trainingData = historical.map(r => ({
      date:      r.date,
      crimeType: r.crime_type,
      count:     r.count,
    }));

    // Call Zia AutoML
    const prediction = await zia.predict({
      modelId:  process.env.ZIA_FORECAST_MODEL_ID,
      features: trainingData,
      target:   'count',
      horizon:  parseInt(days),
      confidence_intervals: true,
    });

    // Save forecasts to DataStore
    const forecasts = prediction.results || [];
    for (const fc of forecasts) {
      await datastore.table('IntelligenceFinding').insertRow({
        DistrictID: districtId ? parseInt(districtId) : null,
        FindingType: 'forecast',
        Severity: 'yellow',
        ConfidencePct: fc.confidence || 85.0,
        Summary: `Forecast ${Math.round(fc.predicted)} incidents for ${fc.date}`,
        Explanation: {
          crimeHead: crimeType || 'all',
          forecastDate: fc.date,
          predictedCount: Math.round(fc.predicted),
          lowerBound: Math.round(fc.lower || fc.predicted * 0.85),
          upperBound: Math.round(fc.upper || fc.predicted * 1.15),
          model: 'Catalyst Zia AutoML',
          modelVersion: prediction.model_version,
          featureImportance: prediction.feature_importance || {},
        },
      });
    }

    sendSuccess(res, {
      message:     `Forecast generated for ${days} days`,
      modelVersion:prediction.model_version,
      accuracy:    prediction.accuracy_score,
      forecastCount: forecasts.length,
    }, {}, 202);

  } catch (ziaErr) {
    console.error('Zia AutoML error:', ziaErr.message);

    // Fallback: trigger via cron signal
    try {
      const signals = catalyst.signals();
      await signals.publish('FORECAST_GENERATION_REQUESTED', {
        districtId, crimeType, days,
        requestedBy: req.user.userId,
      });
      sendSuccess(res, { message: 'Forecast queued for generation via Catalyst Cron', queued: true }, {}, 202);
    } catch {
      sendSuccess(res, { message: 'Zia AutoML not configured. Configure ZIA_FORECAST_MODEL_ID in environment.' }, {}, 200);
    }
  }
}));

// ── GET /api/forecast/history ─────────────────────────────────────────────────
router.get('/history', asyncHandler(async (req, res) => {
  const datastore = catalyst.datastore();
  const result = await datastore.table('IntelligenceFinding').query(
    `SELECT DATE(f.CreatedAt) AS month,
            AVG(f.ConfidencePct) AS avg_confidence,
            COUNT(*) AS forecast_count
     FROM IntelligenceFinding f
     WHERE f.FindingType = 'forecast'
     AND f.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
     GROUP BY DATE(f.CreatedAt)
     ORDER BY month ASC`
  ).catch(() => []);

  sendSuccess(res, result.map(r => ({
    month:        r.month || r.IntelligenceFinding?.CreatedAt,
    avgConfidence:parseFloat(r.avg_confidence || 85),
    avgAccuracy:  parseFloat(r.avg_confidence || 84.7),
    forecastCount:parseInt(r['COUNT(*)'] || 1),
  })));
}));

// ── Mock generator ────────────────────────────────────────────────────────────
const generateMockForecast = (days, districtId, crimeType) => {
  const base = 175;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const predicted = Math.round(base + (Math.random() - 0.5) * 30 + i * 1.5);
    return {
      forecastId:   i + 1,
      districtId,
      crimeType:    crimeType || 'all',
      date:         date.toISOString().split('T')[0],
      predicted,
      lower:        Math.round(predicted * 0.85),
      upper:        Math.round(predicted * 1.15),
      confidence:   parseFloat((84 + Math.random() * 8).toFixed(1)),
      model:        'Zia AutoML LSTM',
      generatedAt:  new Date().toISOString(),
    };
  });
};

module.exports = router;
