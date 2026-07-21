/**
 * Crime Management Routes
 * Full CRUD for FIRs, incidents, criminals, victims, evidence
 */

'use strict';

const express  = require('express');
const Joi      = require('joi');
const catalyst = require('catalyst-sdk');

const { asyncHandler, sendSuccess, paginate } = require('../middleware/errors');
const { requireRole, requireDistrictScope }   = require('../middleware/auth');

const router = express.Router();

// ── Validation ────────────────────────────────────────────────────────────────
const firSchema = Joi.object({
  firNumber:    Joi.string().required(),
  districtId:   Joi.number().required(),
  stationId:    Joi.number().required(),
  crimeType:    Joi.string().required(),
  crimeCategory:Joi.string().required(),
  severity:     Joi.string().valid('critical','high','medium','low').required(),
  incidentDate: Joi.date().iso().required(),
  incidentTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  locationDesc: Joi.string().optional(),
  lat:          Joi.number().min(-90).max(90).optional(),
  lng:          Joi.number().min(-180).max(180).optional(),
  description:  Joi.string().required(),
  assignedTo:   Joi.number().optional(),
});

// ── GET /api/crimes ───────────────────────────────────────────────────────────
// Search + filter FIRs with pagination
router.get('/', requireDistrictScope, asyncHandler(async (req, res) => {
  const { page, perPage, offset } = paginate(req.query);
  const {
    districtId, stationId, severity, status,
    crimeType, search, dateFrom, dateTo,
  } = req.query;

  let whereClauses = [];
  if (districtId)  whereClauses.push(`f.district_id = ${parseInt(districtId)}`);
  if (stationId)   whereClauses.push(`f.station_id = ${parseInt(stationId)}`);
  if (severity)    whereClauses.push(`f.severity = '${severity}'`);
  if (status)      whereClauses.push(`f.status = '${status}'`);
  if (crimeType)   whereClauses.push(`f.crime_type LIKE '%${crimeType.replace(/'/g, "''")}%'`);
  if (dateFrom)    whereClauses.push(`f.incident_date >= '${dateFrom}'`);
  if (dateTo)      whereClauses.push(`f.incident_date <= '${dateTo}'`);
  if (search)      whereClauses.push(
    `MATCH(f.description, f.crime_type, f.location_desc) AGAINST('${search.replace(/'/g, "''")}' IN BOOLEAN MODE)`
  );

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const datastore = catalyst.datastore();

    const [countResult, dataResult] = await Promise.all([
      datastore.table('FIR').query(
        `SELECT COUNT(*) AS total FROM FIR f ${where}`
      ),
      datastore.table('FIR').query(
        `SELECT f.*, d.name_en AS district_name, s.name_en AS station_name,
                u.full_name AS assigned_name
         FROM FIR f
         LEFT JOIN District d ON f.district_id = d.district_id
         LEFT JOIN Station s  ON f.station_id  = s.station_id
         LEFT JOIN Users u    ON f.assigned_to = u.user_id
         ${where}
         ORDER BY f.created_at DESC
         LIMIT ${perPage} OFFSET ${offset}`
      ),
    ]);

    const total = countResult[0]?.['COUNT(*)'] || 0;
    const firs  = dataResult.map(row => ({
      firId:       row.FIR.fir_id,
      firNumber:   row.FIR.fir_number,
      districtId:  row.FIR.district_id,
      districtName:row.District?.name_en,
      stationId:   row.FIR.station_id,
      stationName: row.Station?.name_en,
      crimeType:   row.FIR.crime_type,
      severity:    row.FIR.severity,
      status:      row.FIR.status,
      incidentDate:row.FIR.incident_date,
      assignedTo:  row.FIR.assigned_to,
      assignedName:row.Users?.full_name,
      createdAt:   row.FIR.created_at,
    }));

    sendSuccess(res, firs, { total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (err) {
    // Return mock data in dev
    if (process.env.NODE_ENV === 'development') {
      return sendSuccess(res, [], { total: 0, page, perPage, totalPages: 0, mock: true });
    }
    throw err;
  }
}));

// ── GET /api/crimes/:id ───────────────────────────────────────────────────────
router.get('/:id', requireDistrictScope, asyncHandler(async (req, res) => {
  const firId = parseInt(req.params.id);

  const datastore = catalyst.datastore();
  const result = await datastore.table('FIR').query(
    `SELECT f.*, d.name_en AS district_name, s.name_en AS station_name
     FROM FIR f
     LEFT JOIN District d ON f.district_id = d.district_id
     LEFT JOIN Station s  ON f.station_id  = s.station_id
     WHERE f.fir_id = ${firId} LIMIT 1`
  );

  if (!result?.length) return res.status(404).json({ success: false, error: 'FIR not found' });

  // Fetch related data in parallel
  const [victims, criminals, evidence] = await Promise.all([
    datastore.table('Victim').query(`SELECT * FROM Victim WHERE fir_id = ${firId}`),
    datastore.table('CriminalFIR').query(
      `SELECT cr.*, cf.role AS fir_role FROM Criminal cr
       JOIN CriminalFIR cf ON cr.criminal_id = cf.criminal_id
       WHERE cf.fir_id = ${firId}`
    ),
    datastore.table('Evidence').query(`SELECT * FROM Evidence WHERE fir_id = ${firId}`),
  ]);

  const row = result[0];
  sendSuccess(res, {
    ...row.FIR,
    districtName: row.District?.name_en,
    stationName:  row.Station?.name_en,
    victims:  victims.map(v => v.Victim),
    criminals:criminals.map(c => ({ ...c.Criminal, firRole: c.fir_role })),
    evidence: evidence.map(e => e.Evidence),
  });
}));

// ── POST /api/crimes ──────────────────────────────────────────────────────────
router.post('/', requireRole('station_officer'), asyncHandler(async (req, res) => {
  const { error, value } = firSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const datastore = catalyst.datastore();
  const newRow = await datastore.table('FIR').insertRow({
    fir_number:    value.firNumber,
    district_id:   value.districtId,
    station_id:    value.stationId,
    crime_type:    value.crimeType,
    crime_category:value.crimeCategory,
    severity:      value.severity,
    status:        'open',
    incident_date: value.incidentDate,
    incident_time: value.incidentTime,
    location_desc: value.locationDesc,
    lat:           value.lat,
    lng:           value.lng,
    description:   value.description,
    assigned_to:   value.assignedTo,
    created_by:    req.user.userId,
  });

  // Trigger Catalyst Signal for new high-severity FIR
  if (['critical', 'high'].includes(value.severity)) {
    try {
      await triggerFIRSignal(newRow.fir_id, value);
    } catch (signalErr) {
      console.error('Signal trigger failed:', signalErr.message);
    }
  }

  sendSuccess(res, { firId: newRow.fir_id, firNumber: value.firNumber }, {}, 201);
}));

// ── PUT /api/crimes/:id ───────────────────────────────────────────────────────
router.put('/:id', requireRole('station_officer'), asyncHandler(async (req, res) => {
  const firId = parseInt(req.params.id);
  const updates = {};
  const allowed = ['status', 'severity', 'assignedTo', 'description', 'closedAt'];

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      // camelCase → snake_case
      const dbField = field.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      updates[dbField] = req.body[field];
    }
  }

  const datastore = catalyst.datastore();
  await datastore.table('FIR').updateRow({ fir_id: firId, ...updates });

  sendSuccess(res, { firId, updated: Object.keys(updates) });
}));

// ── DELETE /api/crimes/:id (soft delete — super_admin only) ──────────────────
router.delete('/:id', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const firId = parseInt(req.params.id);
  const datastore = catalyst.datastore();
  // Soft delete: set status to 'closed' with a deletion flag
  await datastore.table('FIR').updateRow({ fir_id: firId, status: 'closed' });
  sendSuccess(res, { firId, message: 'FIR soft-deleted (closed)' });
}));

// ── GET /api/crimes/heatmap (aggregated geo data) ────────────────────────────
router.get('/geo/heatmap', requireDistrictScope, asyncHandler(async (req, res) => {
  const { crimeType, dateFrom, dateTo } = req.query;
  let where = "WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL";
  if (crimeType) where += ` AND f.crime_type = '${crimeType}'`;
  if (dateFrom)  where += ` AND f.incident_date >= '${dateFrom}'`;
  if (dateTo)    where += ` AND f.incident_date <= '${dateTo}'`;

  const datastore = catalyst.datastore();
  const result = await datastore.table('FIR').query(
    `SELECT f.lat, f.lng, f.severity, f.crime_type,
            COUNT(*) AS point_count,
            d.name_en AS district_name
     FROM FIR f
     LEFT JOIN District d ON f.district_id = d.district_id
     ${where}
     GROUP BY f.district_id, f.crime_type
     ORDER BY point_count DESC`
  );

  sendSuccess(res, result.map(r => ({
    lat:          parseFloat(r.FIR.lat),
    lng:          parseFloat(r.FIR.lng),
    count:        r['COUNT(*)'],
    severity:     r.FIR.severity,
    crimeType:    r.FIR.crime_type,
    districtName: r.District?.name_en,
  })));
}));

// ── Helper: Trigger Catalyst Signal ──────────────────────────────────────────
const triggerFIRSignal = async (firId, firData) => {
  const signals = catalyst.signals();
  await signals.publish('NEW_HIGH_SEVERITY_FIR', {
    firId,
    severity: firData.severity,
    districtId: firData.districtId,
    crimeType: firData.crimeType,
    timestamp: new Date().toISOString(),
  });
};

module.exports = router;
