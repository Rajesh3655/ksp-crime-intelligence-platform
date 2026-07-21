/**
 * Alerts Module
 * GET  /api/alerts         — list alerts (filtered)
 * GET  /api/alerts/:id     — single alert
 * POST /api/alerts/:id/acknowledge
 * POST /api/alerts/:id/escalate
 * POST /api/alerts/:id/resolve
 * POST /api/alerts/:id/assign
 */

'use strict';

const express  = require('express');
const Joi      = require('joi');
const catalyst = require('catalyst-sdk');

const { asyncHandler, sendSuccess, paginate } = require('../middleware/errors');
const { requireRole }                         = require('../middleware/auth');

const router = express.Router();

// ── GET /api/alerts ───────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, perPage, offset } = paginate(req.query);
  const { status, severity, districtId } = req.query;

  let where = ['1=1'];
  if (status)     where.push(`a.status = '${status}'`);
  if (severity)   where.push(`a.severity = '${severity}'`);
  if (districtId) where.push(`a.district_id = ${parseInt(districtId)}`);

  // District-scope enforcement
  if (!['super_admin', 'scrb_analyst'].includes(req.user.role) && req.user.districtId) {
    where.push(`a.district_id = ${req.user.districtId}`);
  }

  try {
    const datastore = catalyst.datastore();
    const [countResult, alerts] = await Promise.all([
      datastore.table('Alert').query(`SELECT COUNT(*) AS total FROM Alert a WHERE ${where.join(' AND ')}`),
      datastore.table('Alert').query(
        `SELECT a.*, d.name_en AS district_name, u.full_name AS assigned_name
         FROM Alert a
         LEFT JOIN District d ON a.district_id = d.district_id
         LEFT JOIN Users u    ON a.assigned_to = u.user_id
         WHERE ${where.join(' AND ')}
         ORDER BY
           CASE a.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
           a.created_at DESC
         LIMIT ${perPage} OFFSET ${offset}`
      ),
    ]);

    const total = countResult[0]?.['COUNT(*)'] || 0;
    sendSuccess(res, alerts.map(r => ({
      alertId:      r.Alert.alert_id,
      type:         r.Alert.alert_type,
      severity:     r.Alert.severity,
      districtId:   r.Alert.district_id,
      districtName: r.District?.name_en,
      message:      req.user.lang === 'kn' && r.Alert.message_kn ? r.Alert.message_kn : r.Alert.message,
      status:       r.Alert.status,
      assignedTo:   r.Alert.assigned_to,
      assignedName: r.Users?.full_name,
      createdAt:    r.Alert.created_at,
    })), { total, page, perPage });
  } catch {
    sendSuccess(res, [], { total: 0, page, perPage, mock: true });
  }
}));

// ── POST /api/alerts/:id/acknowledge ─────────────────────────────────────────
router.post('/:id/acknowledge', asyncHandler(async (req, res) => {
  const alertId = parseInt(req.params.id);
  const datastore = catalyst.datastore();

  await datastore.table('Alert').updateRow({
    alert_id:        alertId,
    status:          'acknowledged',
    acknowledged_by: req.user.userId,
    acknowledged_at: new Date().toISOString(),
  });

  // Trigger Circuit step via Catalyst Circuits
  try {
    const circuits = catalyst.circuits();
    await circuits.trigger('ALERT_ACKNOWLEDGED', {
      alertId, acknowledgedBy: req.user.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (e) { console.error('Circuit trigger error:', e.message); }

  sendSuccess(res, { alertId, status: 'acknowledged' });
}));

// ── POST /api/alerts/:id/escalate ─────────────────────────────────────────────
router.post('/:id/escalate', requireRole('district_officer'), asyncHandler(async (req, res) => {
  const alertId = parseInt(req.params.id);
  const datastore = catalyst.datastore();

  await datastore.table('Alert').updateRow({
    alert_id: alertId,
    severity: 'critical',
    status:   'active',
  });

  // Trigger escalation circuit
  try {
    const circuits = catalyst.circuits();
    await circuits.trigger('ALERT_ESCALATED', {
      alertId, escalatedBy: req.user.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (e) { console.error('Circuit trigger error:', e.message); }

  sendSuccess(res, { alertId, severity: 'critical', message: 'Alert escalated to critical' });
}));

// ── POST /api/alerts/:id/resolve ──────────────────────────────────────────────
router.post('/:id/resolve', asyncHandler(async (req, res) => {
  const alertId   = parseInt(req.params.id);
  const datastore = catalyst.datastore();

  await datastore.table('Alert').updateRow({
    alert_id:    alertId,
    status:      'resolved',
    resolved_by: req.user.userId,
    resolved_at: new Date().toISOString(),
  });

  sendSuccess(res, { alertId, status: 'resolved' });
}));

// ── POST /api/alerts/:id/assign ───────────────────────────────────────────────
router.post('/:id/assign', requireRole('district_officer'), asyncHandler(async (req, res) => {
  const alertId   = parseInt(req.params.id);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  const datastore = catalyst.datastore();
  await datastore.table('Alert').updateRow({ alert_id: alertId, assigned_to: parseInt(userId) });

  // Send push notification to assigned officer
  try {
    const push = catalyst.push();
    await push.send({
      to:      userId.toString(),
      title:   'Alert Assigned',
      message: `An alert has been assigned to you. Alert ID: ${alertId}`,
      data:    { alertId, type: 'ALERT_ASSIGNMENT' },
    });
  } catch (e) { console.error('Push notification error:', e.message); }

  sendSuccess(res, { alertId, assignedTo: userId });
}));

module.exports = router;
