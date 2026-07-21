/**
 * Risk Analysis Routes
 * Risk scores are derived intelligence findings over the official FIR ERD.
 */

'use strict';

const express = require('express');
const catalyst = require('catalyst-sdk');
const { asyncHandler, sendSuccess } = require('../middleware/errors');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const levelFromSeverity = severity => ({
  red: 'critical',
  orange: 'high',
  yellow: 'medium',
  green: 'low',
}[severity] || 'medium');

const normalizeRiskFinding = row => {
  const finding = row.IntelligenceFinding || row;
  const district = row.District || {};
  const explanation = typeof finding.Explanation === 'string'
    ? JSON.parse(finding.Explanation || '{}')
    : finding.Explanation || {};

  return {
    districtId: finding.DistrictID,
    districtName: district.DistrictName || row.district_name,
    lat: parseFloat(district.latitude || 14.5),
    lng: parseFloat(district.longitude || 75.7),
    overallScore: explanation.overallScore || Math.round(Number(finding.ConfidencePct || 0)),
    riskLevel: levelFromSeverity(finding.Severity),
    trend: explanation.trend || 'stable',
    factors: {
      crimeRate: explanation.crimeRateScore || 0,
      recidivism: explanation.recidivismScore || 0,
      socioeconomic: explanation.socioeconomicScore || 0,
      infrastructure: explanation.infrastructureScore || 0,
    },
    computedAt: finding.CreatedAt,
  };
};

router.get('/', asyncHandler(async (_req, res) => {
  try {
    const datastore = catalyst.datastore();
    const result = await datastore.table('IntelligenceFinding').query(
      `SELECT f.*, d.DistrictName AS district_name
       FROM IntelligenceFinding f
       LEFT JOIN District d ON f.DistrictID = d.DistrictID
       WHERE f.FindingType = 'risk'
       ORDER BY f.CreatedAt DESC`
    );

    sendSuccess(res, result.map(normalizeRiskFinding));
  } catch {
    sendSuccess(res, getMockRiskScores(), { mock: true });
  }
}));

router.get('/:districtId', asyncHandler(async (req, res) => {
  const districtId = parseInt(req.params.districtId, 10);
  const datastore = catalyst.datastore();

  const rows = await datastore.table('IntelligenceFinding').query(
    `SELECT f.*, d.DistrictName AS district_name
     FROM IntelligenceFinding f
     LEFT JOIN District d ON f.DistrictID = d.DistrictID
     WHERE f.FindingType = 'risk' AND f.DistrictID = ${districtId}
     ORDER BY f.CreatedAt DESC LIMIT 30`
  ).catch(() => []);

  if (!rows.length) return res.status(404).json({ success: false, error: 'District risk data not found' });

  const current = normalizeRiskFinding(rows[0]);
  sendSuccess(res, {
    districtId,
    districtName: current.districtName,
    current,
    history: rows.map(row => {
      const risk = normalizeRiskFinding(row);
      return { score: risk.overallScore, level: risk.riskLevel, computedAt: risk.computedAt };
    }),
  });
}));

router.post('/compute', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const { districtIds } = req.body;

  try {
    const signals = catalyst.signals();
    await signals.publish('RISK_COMPUTATION_REQUESTED', {
      districtIds: districtIds || 'all',
      requestedBy: req.user.userId,
      timestamp: new Date().toISOString(),
    });
    sendSuccess(res, { message: 'Risk computation queued', estimatedTime: '2-5 minutes' }, {}, 202);
  } catch (e) {
    console.error('Risk signal error:', e.message);
    sendSuccess(res, { message: 'Could not queue risk computation. Catalyst Signals not configured.' });
  }
}));

const getMockRiskScores = () => [
  { districtId: 1, districtName: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, overallScore: 72, riskLevel: 'critical', trend: 'up', factors: { crimeRate: 88, recidivism: 62, socioeconomic: 71, infrastructure: 45 } },
  { districtId: 2, districtName: 'Kalaburagi', lat: 17.3297, lng: 76.8343, overallScore: 67, riskLevel: 'critical', trend: 'up', factors: { crimeRate: 74, recidivism: 68, socioeconomic: 82, infrastructure: 60 } },
  { districtId: 3, districtName: 'Vijayapura', lat: 16.8302, lng: 75.7100, overallScore: 63, riskLevel: 'high', trend: 'stable', factors: { crimeRate: 70, recidivism: 55, socioeconomic: 75, infrastructure: 55 } },
  { districtId: 4, districtName: 'Belagavi', lat: 15.8497, lng: 74.4977, overallScore: 61, riskLevel: 'high', trend: 'down', factors: { crimeRate: 68, recidivism: 50, socioeconomic: 70, infrastructure: 52 } },
  { districtId: 5, districtName: 'Mysuru', lat: 12.2958, lng: 76.6394, overallScore: 48, riskLevel: 'medium', trend: 'down', factors: { crimeRate: 52, recidivism: 40, socioeconomic: 55, infrastructure: 42 } },
];

module.exports = router;
