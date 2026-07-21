'use strict';

const express = require('express');
const catalyst = require('catalyst-sdk');
const { analyzeCase, generateRepeatOffenderProfiles } = require('../services/intelligenceEngine');
const { asyncHandler, sendSuccess } = require('../middleware/errors');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/cases/:caseMasterId/analyze', asyncHandler(async (req, res) => {
  const result = await analyzeCase(req.params.caseMasterId);
  if (!result) return res.status(404).json({ success: false, error: 'CaseMaster record not found' });
  sendSuccess(res, result, {}, 201);
}));

router.post('/cases/analyze-recent', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const limit = Math.min(250, Math.max(1, parseInt(req.body.limit || 50, 10)));
  const rows = await catalyst.datastore().table('CaseMaster').query(
    `SELECT CaseMasterID FROM CaseMaster ORDER BY CrimeRegisteredDate DESC LIMIT ${limit}`
  ).catch(() => []);

  const results = [];
  for (const row of rows) {
    const caseMasterId = row.CaseMaster?.CaseMasterID || row.CaseMasterID;
    const result = await analyzeCase(caseMasterId);
    if (result) results.push(result.intelligence);
  }

  sendSuccess(res, { analyzed: results.length, results }, {}, 202);
}));

router.get('/cases/:caseMasterId/explain', asyncHandler(async (req, res) => {
  const id = `case-intel-${parseInt(req.params.caseMasterId, 10)}`;
  try {
    const doc = await catalyst.nosql().collection('CrimeIntelligence').get(id);
    return sendSuccess(res, doc.explainable_ai || doc);
  } catch {
    const result = await analyzeCase(req.params.caseMasterId);
    if (!result) return res.status(404).json({ success: false, error: 'CaseMaster record not found' });
    return sendSuccess(res, result.intelligence.explainable_ai);
  }
}));

router.get('/graph/:caseMasterId', asyncHandler(async (req, res) => {
  const id = `graph-${parseInt(req.params.caseMasterId, 10)}`;
  try {
    const graph = await catalyst.nosql().collection('InvestigationGraph').get(id);
    return sendSuccess(res, graph);
  } catch {
    const result = await analyzeCase(req.params.caseMasterId);
    if (!result) return res.status(404).json({ success: false, error: 'CaseMaster record not found' });
    return sendSuccess(res, result.graph);
  }
}));

router.post('/repeat-offenders/recompute', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const profiles = await generateRepeatOffenderProfiles(req.body.limit || 50);
  sendSuccess(res, { profiles }, {}, 202);
}));

router.get('/geo/replay', asyncHandler(async (req, res) => {
  const { interval = 'week', districtId } = req.query;
  const bucket = interval === 'month' ? '%Y-%m-01' : '%x-W%v';
  const districtFilter = districtId ? `AND u.DistrictID = ${parseInt(districtId, 10)}` : '';
  const rows = await catalyst.datastore().table('CaseMaster').query(
    `SELECT DATE_FORMAT(cm.CrimeRegisteredDate, '${bucket}') AS frame,
            cm.latitude, cm.longitude, ch.CrimeGroupName, d.DistrictName, COUNT(*) AS count
     FROM CaseMaster cm
     LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
     LEFT JOIN District d ON u.DistrictID = d.DistrictID
     LEFT JOIN CrimeHead ch ON cm.CrimeMajorHeadID = ch.CrimeHeadID
     WHERE cm.latitude IS NOT NULL AND cm.longitude IS NOT NULL ${districtFilter}
     GROUP BY frame, cm.latitude, cm.longitude, ch.CrimeGroupName, d.DistrictName
     ORDER BY frame ASC`
  ).catch(() => []);

  sendSuccess(res, {
    interval,
    frames: rows.map(row => ({
      frame: row.frame,
      lat: parseFloat(row.CaseMaster?.latitude || row.latitude),
      lng: parseFloat(row.CaseMaster?.longitude || row.longitude),
      crimeHead: row.CrimeHead?.CrimeGroupName || row.CrimeGroupName,
      districtName: row.District?.DistrictName || row.DistrictName,
      count: parseInt(row.count || row['COUNT(*)'] || 0, 10),
      overlays: ['heatmap', 'prediction', 'police_deployment'],
    })),
  });
}));

router.get('/scrb/briefing', asyncHandler(async (req, res) => {
  const findings = await catalyst.datastore().table('IntelligenceFinding').query(
    `SELECT * FROM IntelligenceFinding ORDER BY CreatedAt DESC LIMIT 100`
  ).catch(() => []);
  const normalized = findings.map(row => row.IntelligenceFinding || row);
  sendSuccess(res, {
    aiSummary: 'Recent CIAP intelligence highlights elevated hotspots, repeat-offender signals, and district-level deployment needs.',
    topTrends: normalized.filter(f => f.FindingType === 'pattern').slice(0, 10),
    hotspots: normalized.filter(f => f.FindingType === 'hotspot').slice(0, 10),
    districtRanking: normalized.filter(f => f.FindingType === 'risk').slice(0, 10),
    officerRanking: normalized.filter(f => f.FindingType === 'anomaly' && String(f.Summary || '').toLowerCase().includes('officer')).slice(0, 10),
    predictions: normalized.filter(f => f.FindingType === 'forecast').slice(0, 10),
    recommendedDeployment: normalized.filter(f => f.FindingType === 'deployment').slice(0, 10),
    recommendedPatrol: normalized.filter(f => String(f.Explanation || '').toLowerCase().includes('patrol')).slice(0, 10),
    emergingCrimeTypes: normalized.filter(f => f.FindingType === 'pattern').slice(0, 5),
  });
}));

module.exports = router;
