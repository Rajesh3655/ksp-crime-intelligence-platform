/**
 * Alerts Module
 * Alerts are high-priority IntelligenceFinding records.
 */

'use strict';

const express = require('express');
const catalyst = require('catalyst-sdk');

const { asyncHandler, sendSuccess, paginate } = require('../middleware/errors');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const severityToAlert = severity => ({
  red: 'critical',
  orange: 'high',
  yellow: 'medium',
  green: 'low',
}[severity] || 'medium');

const alertToSeverity = alert => ({
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'green',
}[alert] || alert);

const parseJson = value => {
  if (!value || typeof value !== 'string') return value || {};
  try { return JSON.parse(value); } catch { return {}; }
};

const normalizeAlert = row => {
  const finding = row.IntelligenceFinding || row;
  const explanation = parseJson(finding.Explanation);
  return {
    alertId: finding.FindingID,
    type: finding.FindingType,
    severity: severityToAlert(finding.Severity),
    districtId: finding.DistrictID,
    districtName: row.District?.DistrictName || row.district_name,
    message: finding.Summary,
    status: explanation.status || 'active',
    assignedTo: explanation.assignedTo || null,
    assignedName: explanation.assignedName || null,
    confidence: Number(finding.ConfidencePct || 0),
    createdAt: finding.CreatedAt,
    explanation,
  };
};

router.get('/', asyncHandler(async (req, res) => {
  const { page, perPage, offset } = paginate(req.query);
  const { status, severity, districtId } = req.query;

  const where = ["f.FindingType IN ('alert','anomaly','hotspot','forecast','risk')"];
  if (severity) where.push(`f.Severity = '${alertToSeverity(severity)}'`);
  if (districtId) where.push(`f.DistrictID = ${parseInt(districtId, 10)}`);
  if (!['super_admin', 'scrb_analyst'].includes(req.user.role) && req.user.districtId) {
    where.push(`f.DistrictID = ${parseInt(req.user.districtId, 10)}`);
  }

  try {
    const datastore = catalyst.datastore();
    const rows = await datastore.table('IntelligenceFinding').query(
      `SELECT f.*, d.DistrictName AS district_name
       FROM IntelligenceFinding f
       LEFT JOIN District d ON f.DistrictID = d.DistrictID
       WHERE ${where.join(' AND ')}
       ORDER BY CASE f.Severity WHEN 'red' THEN 1 WHEN 'orange' THEN 2 WHEN 'yellow' THEN 3 ELSE 4 END,
                f.CreatedAt DESC
       LIMIT ${perPage} OFFSET ${offset}`
    ).catch(() => []);

    const alerts = rows.map(normalizeAlert).filter(alert => !status || alert.status === status);
    sendSuccess(res, alerts, { total: alerts.length, page, perPage });
  } catch {
    sendSuccess(res, [], { total: 0, page, perPage, mock: true });
  }
}));

router.post('/:id/acknowledge', asyncHandler(async (req, res) => {
  const alertId = parseInt(req.params.id, 10);
  const datastore = catalyst.datastore();
  await datastore.table('IntelligenceFinding').updateRow({
    FindingID: alertId,
    Explanation: {
      status: 'acknowledged',
      acknowledgedBy: req.user.userId,
      acknowledgedAt: new Date().toISOString(),
    },
  });

  await catalyst.circuits().trigger('ALERT_ACKNOWLEDGED', {
    alertId,
    acknowledgedBy: req.user.userId,
    timestamp: new Date().toISOString(),
  }).catch(e => console.error('Circuit trigger error:', e.message));

  sendSuccess(res, { alertId, status: 'acknowledged' });
}));

router.post('/:id/escalate', requireRole('district_officer'), asyncHandler(async (req, res) => {
  const alertId = parseInt(req.params.id, 10);
  await catalyst.datastore().table('IntelligenceFinding').updateRow({
    FindingID: alertId,
    Severity: 'red',
    Explanation: {
      status: 'active',
      escalatedBy: req.user.userId,
      escalatedAt: new Date().toISOString(),
    },
  });

  await catalyst.circuits().trigger('ALERT_ESCALATED', {
    alertId,
    escalatedBy: req.user.userId,
    timestamp: new Date().toISOString(),
  }).catch(e => console.error('Circuit trigger error:', e.message));

  sendSuccess(res, { alertId, severity: 'critical', message: 'Alert escalated to critical' });
}));

router.post('/:id/resolve', asyncHandler(async (req, res) => {
  const alertId = parseInt(req.params.id, 10);
  await catalyst.datastore().table('IntelligenceFinding').updateRow({
    FindingID: alertId,
    Severity: 'green',
    Explanation: {
      status: 'resolved',
      resolvedBy: req.user.userId,
      resolvedAt: new Date().toISOString(),
    },
  });

  sendSuccess(res, { alertId, status: 'resolved' });
}));

router.post('/:id/assign', requireRole('district_officer'), asyncHandler(async (req, res) => {
  const alertId = parseInt(req.params.id, 10);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  await catalyst.datastore().table('IntelligenceFinding').updateRow({
    FindingID: alertId,
    Explanation: {
      status: 'active',
      assignedTo: parseInt(userId, 10),
      assignedAt: new Date().toISOString(),
      assignedBy: req.user.userId,
    },
  });

  await catalyst.push().send({
    to: userId.toString(),
    title: 'Intelligence Alert Assigned',
    message: `An intelligence alert has been assigned to you. Alert ID: ${alertId}`,
    data: { alertId, type: 'ALERT_ASSIGNMENT' },
  }).catch(e => console.error('Push notification error:', e.message));

  sendSuccess(res, { alertId, assignedTo: userId });
}));

module.exports = router;
