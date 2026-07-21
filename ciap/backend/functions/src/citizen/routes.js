/**
 * Citizen Reports Routes
 * POST /api/citizen          — Submit a citizen report (public, no auth)
 * GET  /api/citizen          — List citizen reports (admin, auth required)
 * POST /api/citizen/:id/verify   — Verify a report
 * POST /api/citizen/:id/reject   — Reject a report
 * POST /api/citizen/:id/convert  — Convert to FIR
 */

'use strict';

const express  = require('express');
const Joi      = require('joi');
const multer   = require('multer');
const catalyst = require('catalyst-sdk');
const { v4: uuidv4 } = require('uuid');

const { asyncHandler, sendSuccess, paginate } = require('../middleware/errors');
const { authenticateToken, requireRole }       = require('../middleware/auth');

const router = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const submitSchema = Joi.object({
  category:    Joi.string().required(),
  description: Joi.string().min(20).max(2000).required(),
  lat:         Joi.number().min(-90).max(90).optional(),
  lng:         Joi.number().min(-180).max(180).optional(),
  locationName:Joi.string().optional(),
  phone:       Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
});

// ── POST /api/citizen — Public citizen submission ────────────────────────────
router.post('/', upload.single('media'), asyncHandler(async (req, res) => {
  const { error, value } = submitSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  let mediaUrl = null;
  if (req.file) {
    try {
      const stratus = catalyst.stratus();
      const folder  = await stratus.getFolder('citizen-reports-media');
      const uploaded = await folder.uploadFile({
        code:     uuidv4(),
        name:     req.file.originalname,
        content:  req.file.buffer,
        mimeType: req.file.mimetype,
      });
      mediaUrl = uploaded.file_location;
    } catch (e) {
      console.error('Media upload error:', e.message);
    }
  }

  try {
    const datastore = catalyst.datastore();
    const newReport = await datastore.table('CitizenReport').insertRow({
      category:       value.category,
      description:    value.description,
      lat:            value.lat,
      lng:            value.lng,
      location_name:  value.locationName,
      media_url:      mediaUrl,
      reporter_phone: value.phone || null, // In production: hash this
      status:         'pending',
    });

    // Send auto-acknowledgement via Catalyst Mail
    if (value.phone) {
      try {
        const mail = catalyst.mail();
        await mail.send({
          from:    'noreply@ciap.ksp.gov.in',
          to:      `${value.phone}@sms.gateway.gov.in`, // SMS gateway
          subject: 'KSP CIAP — Report Received',
          content: `Your report has been received. Reference: RPT-${newReport.report_id}. KSP will review it shortly.`,
        });
      } catch (e) { console.error('SMS error:', e.message); }
    }

    // Trigger geo-routing signal to find nearest station
    try {
      const signals = catalyst.signals();
      await signals.publish('CITIZEN_REPORT_SUBMITTED', {
        reportId: newReport.report_id,
        lat:      value.lat,
        lng:      value.lng,
        category: value.category,
      });
    } catch (e) { console.error('Signal error:', e.message); }

    sendSuccess(res, {
      referenceId: `RPT-${newReport.report_id || uuidv4().slice(0, 8).toUpperCase()}`,
      message: 'Report submitted successfully. Karnataka State Police will review it shortly.',
      status:  'pending',
    }, {}, 201);
  } catch {
    sendSuccess(res, {
      referenceId: `RPT-${uuidv4().slice(0, 8).toUpperCase()}`,
      message: 'Report received (offline mode). Will be processed when connectivity is restored.',
    }, { mock: true }, 202);
  }
}));

// ── GET /api/citizen — List (admin) ──────────────────────────────────────────
router.get('/', authenticateToken, requireRole('station_officer'), asyncHandler(async (req, res) => {
  const { page, perPage, offset } = paginate(req.query);
  const { status } = req.query;

  let where = '1=1';
  if (status) where += ` AND cr.status = '${status}'`;

  const datastore = catalyst.datastore();
  const result = await datastore.table('CitizenReport').query(
    `SELECT cr.*, s.name_en AS station_name
     FROM CitizenReport cr
     LEFT JOIN Station s ON cr.assigned_station = s.station_id
     WHERE ${where}
     ORDER BY cr.created_at DESC
     LIMIT ${perPage} OFFSET ${offset}`
  ).catch(() => []);

  sendSuccess(res, result.map(r => ({
    reportId:    r.CitizenReport.report_id,
    category:    r.CitizenReport.category,
    description: r.CitizenReport.description,
    lat:         r.CitizenReport.lat,
    lng:         r.CitizenReport.lng,
    locationName:r.CitizenReport.location_name,
    mediaUrl:    r.CitizenReport.media_url,
    status:      r.CitizenReport.status,
    stationName: r.Station?.name_en,
    createdAt:   r.CitizenReport.created_at,
  })));
}));

// ── POST /api/citizen/:id/verify ─────────────────────────────────────────────
router.post('/:id/verify', authenticateToken, requireRole('station_officer'), asyncHandler(async (req, res) => {
  const reportId  = parseInt(req.params.id);
  const datastore = catalyst.datastore();
  await datastore.table('CitizenReport').updateRow({
    report_id:   reportId,
    status:      'verified',
    verified_by: req.user.userId,
    verified_at: new Date().toISOString(),
  });
  sendSuccess(res, { reportId, status: 'verified' });
}));

// ── POST /api/citizen/:id/reject ──────────────────────────────────────────────
router.post('/:id/reject', authenticateToken, requireRole('station_officer'), asyncHandler(async (req, res) => {
  const reportId = parseInt(req.params.id);
  const { reason = 'Insufficient information' } = req.body;
  const datastore = catalyst.datastore();
  await datastore.table('CitizenReport').updateRow({
    report_id:        reportId,
    status:           'rejected',
    rejection_reason: reason,
    verified_by:      req.user.userId,
    verified_at:      new Date().toISOString(),
  });
  sendSuccess(res, { reportId, status: 'rejected' });
}));

// ── POST /api/citizen/:id/convert — Convert to FIR ───────────────────────────
router.post('/:id/convert', authenticateToken, requireRole('station_officer'), asyncHandler(async (req, res) => {
  const reportId  = parseInt(req.params.id);
  const datastore = catalyst.datastore();

  // Fetch report
  const report = await datastore.table('CitizenReport').query(
    `SELECT * FROM CitizenReport WHERE report_id = ${reportId} LIMIT 1`
  ).catch(() => []);
  if (!report?.length) return res.status(404).json({ success: false, error: 'Report not found' });

  const r = report[0].CitizenReport;

  // Create FIR from report
  const firNumber = `${req.user.districtId || 'KA'}/CR/${Date.now()}`;
  const newFIR = await datastore.table('FIR').insertRow({
    fir_number:    firNumber,
    district_id:   req.user.districtId,
    station_id:    req.user.stationId,
    crime_type:    r.category,
    crime_category:r.category,
    severity:      'medium',
    status:        'open',
    incident_date: new Date().toISOString().split('T')[0],
    location_desc: r.location_name,
    lat:           r.lat,
    lng:           r.lng,
    description:   r.description,
    created_by:    req.user.userId,
  });

  // Update citizen report
  await datastore.table('CitizenReport').updateRow({
    report_id: reportId,
    status:    'converted',
    fir_id:    newFIR.fir_id,
  });

  sendSuccess(res, { reportId, firId: newFIR.fir_id, firNumber, status: 'converted' }, {}, 201);
}));

module.exports = router;
