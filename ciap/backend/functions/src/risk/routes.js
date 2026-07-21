/**
 * Risk Analysis Routes
 * GET /api/risk                 — District risk scores
 * GET /api/risk/:districtId     — Single district detail
 * POST /api/risk/compute        — Trigger risk computation
 */

'use strict';

const express  = require('express');
const catalyst = require('catalyst-sdk');
const { asyncHandler, sendSuccess } = require('../middleware/errors');
const { requireRole }               = require('../middleware/auth');

const router = express.Router();

// ── GET /api/risk ─────────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  try {
    const datastore = catalyst.datastore();
    const result = await datastore.table('RiskScore').query(
      `SELECT rs.*, d.name_en AS district_name, d.hq_lat AS lat, d.hq_lng AS lng
       FROM RiskScore rs
       LEFT JOIN District d ON rs.district_id = d.district_id
       WHERE rs.computed_at = (
         SELECT MAX(rs2.computed_at) FROM RiskScore rs2
         WHERE rs2.district_id = rs.district_id
       )
       ORDER BY rs.overall_score DESC`
    );

    sendSuccess(res, result.map(r => ({
      districtId:          r.RiskScore.district_id,
      districtName:        r.District?.name_en,
      lat:                 parseFloat(r.District?.lat || 14.5),
      lng:                 parseFloat(r.District?.lng || 75.7),
      overallScore:        r.RiskScore.overall_score,
      riskLevel:           r.RiskScore.risk_level,
      trend:               r.RiskScore.trend,
      factors: {
        crimeRate:         r.RiskScore.crime_rate_score,
        recidivism:        r.RiskScore.recidivism_score,
        socioeconomic:     r.RiskScore.socioeconomic_score,
        infrastructure:    r.RiskScore.infrastructure_score,
      },
      computedAt: r.RiskScore.computed_at,
    })));
  } catch {
    // Mock fallback
    sendSuccess(res, getMockRiskScores(), { mock: true });
  }
}));

// ── GET /api/risk/:districtId ─────────────────────────────────────────────────
router.get('/:districtId', asyncHandler(async (req, res) => {
  const districtId = parseInt(req.params.districtId);
  const datastore  = catalyst.datastore();

  const [current, history] = await Promise.all([
    datastore.table('RiskScore').query(
      `SELECT rs.*, d.name_en AS district_name
       FROM RiskScore rs
       LEFT JOIN District d ON rs.district_id = d.district_id
       WHERE rs.district_id = ${districtId}
       ORDER BY rs.computed_at DESC LIMIT 1`
    ).catch(() => []),
    datastore.table('RiskScore').query(
      `SELECT overall_score, risk_level, computed_at FROM RiskScore
       WHERE district_id = ${districtId}
       ORDER BY computed_at DESC LIMIT 30`
    ).catch(() => []),
  ]);

  if (!current?.length) return res.status(404).json({ success: false, error: 'District risk data not found' });

  const r = current[0];
  sendSuccess(res, {
    districtId,
    districtName:  r.District?.name_en,
    current: {
      overallScore:   r.RiskScore.overall_score,
      riskLevel:      r.RiskScore.risk_level,
      trend:          r.RiskScore.trend,
      factors: {
        crimeRate:    r.RiskScore.crime_rate_score,
        recidivism:   r.RiskScore.recidivism_score,
        socioeconomic:r.RiskScore.socioeconomic_score,
        infrastructure:r.RiskScore.infrastructure_score,
      },
      computedAt: r.RiskScore.computed_at,
    },
    history: history.map(h => ({
      score:      h.RiskScore.overall_score,
      level:      h.RiskScore.risk_level,
      computedAt: h.RiskScore.computed_at,
    })),
  });
}));

// ── POST /api/risk/compute ────────────────────────────────────────────────────
router.post('/compute', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const { districtIds } = req.body;

  try {
    const signals = catalyst.signals();
    await signals.publish('RISK_COMPUTATION_REQUESTED', {
      districtIds: districtIds || 'all',
      requestedBy: req.user.userId,
      timestamp:   new Date().toISOString(),
    });
    sendSuccess(res, { message: 'Risk computation queued', estimatedTime: '2-5 minutes' }, {}, 202);
  } catch (e) {
    console.error('Risk signal error:', e.message);
    sendSuccess(res, { message: 'Could not queue risk computation. Catalyst Signals not configured.' });
  }
}));

// ── Mock data ─────────────────────────────────────────────────────────────────
const getMockRiskScores = () => [
  { districtId: 1, districtName: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, overallScore: 72, riskLevel: 'critical', trend: 'up',   factors: { crimeRate: 88, recidivism: 62, socioeconomic: 71, infrastructure: 45 } },
  { districtId: 2, districtName: 'Kalaburagi',      lat: 17.3297, lng: 76.8343, overallScore: 67, riskLevel: 'critical', trend: 'up',   factors: { crimeRate: 74, recidivism: 68, socioeconomic: 82, infrastructure: 60 } },
  { districtId: 3, districtName: 'Vijayapura',      lat: 16.8302, lng: 75.7100, overallScore: 63, riskLevel: 'high',     trend: 'stable',factors: { crimeRate: 70, recidivism: 55, socioeconomic: 75, infrastructure: 55 } },
  { districtId: 4, districtName: 'Belagavi',        lat: 15.8497, lng: 74.4977, overallScore: 61, riskLevel: 'high',     trend: 'down', factors: { crimeRate: 68, recidivism: 50, socioeconomic: 70, infrastructure: 52 } },
  { districtId: 5, districtName: 'Mysuru',          lat: 12.2958, lng: 76.6394, overallScore: 48, riskLevel: 'medium',   trend: 'down', factors: { crimeRate: 52, recidivism: 40, socioeconomic: 55, infrastructure: 42 } },
  { districtId: 6, districtName: 'Hubballi-Dharwad',lat: 15.3647, lng: 75.1240, overallScore: 44, riskLevel: 'medium',   trend: 'stable',factors: { crimeRate: 48, recidivism: 38, socioeconomic: 50, infrastructure: 38 } },
  { districtId: 7, districtName: 'Mangaluru',       lat: 12.8698, lng: 74.8426, overallScore: 38, riskLevel: 'low',      trend: 'down', factors: { crimeRate: 42, recidivism: 30, socioeconomic: 40, infrastructure: 35 } },
  { districtId: 8, districtName: 'Shivamogga',      lat: 13.9299, lng: 75.5681, overallScore: 35, riskLevel: 'low',      trend: 'stable',factors: { crimeRate: 38, recidivism: 28, socioeconomic: 38, infrastructure: 30 } },
];

module.exports = router;
