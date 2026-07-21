/**
 * Admin Routes — User Management, Audit, Districts
 */
'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const Joi      = require('joi');
const catalyst = require('catalyst-sdk');

const { asyncHandler, sendSuccess, paginate } = require('../middleware/errors');
const { requireRole }                         = require('../middleware/auth');

const router = express.Router();

const createUserSchema = Joi.object({
  employeeId:  Joi.string().required(),
  fullName:    Joi.string().required(),
  email:       Joi.string().email().pattern(/@ksp\.gov\.in$/).required()
    .messages({ 'string.pattern.base': 'Email must be a @ksp.gov.in address' }),
  password:    Joi.string().min(12).required(),
  role:        Joi.string().valid('super_admin','scrb_analyst','district_officer','station_officer','investigator').required(),
  districtId:  Joi.number().optional(),
  stationId:   Joi.number().optional(),
  phone:       Joi.string().optional(),
  lang:        Joi.string().valid('en','kn').default('en'),
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', requireRole('district_officer'), asyncHandler(async (req, res) => {
  const { perPage, offset } = paginate(req.query);
  const { role, districtId, status } = req.query;

  let where = ['1=1'];
  if (role)       where.push(`u.role = '${role}'`);
  if (status)     where.push(`u.status = '${status}'`);

  // District officers can only see their district's users
  if (req.user.role === 'district_officer') {
    where.push(`u.district_id = ${req.user.districtId}`);
  } else if (districtId) {
    where.push(`u.district_id = ${parseInt(districtId)}`);
  }

  const datastore = catalyst.datastore();
  const result    = await datastore.table('Users').query(
    `SELECT u.user_id, u.employee_id, u.full_name, u.email, u.phone,
            u.role, u.district_id, u.station_id, u.status, u.last_login_at,
            u.lang_preference, u.created_at,
            d.name_en AS district_name
     FROM Users u
     LEFT JOIN District d ON u.district_id = d.district_id
     WHERE ${where.join(' AND ')}
     ORDER BY u.created_at DESC
     LIMIT ${perPage} OFFSET ${offset}`
  ).catch(() => []);

  sendSuccess(res, result.map(r => ({
    userId:      r.Users.user_id,
    employeeId:  r.Users.employee_id,
    name:        r.Users.full_name,
    email:       r.Users.email,
    role:        r.Users.role,
    districtId:  r.Users.district_id,
    districtName:r.District?.name_en,
    status:      r.Users.status,
    lang:        r.Users.lang_preference,
    lastLoginAt: r.Users.last_login_at,
  })));
}));

// ── POST /api/admin/users ─────────────────────────────────────────────────────
router.post('/users', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const passwordHash = await bcrypt.hash(value.password, 12);

  // Register in Catalyst Auth
  let catalystUid = null;
  try {
    const auth = catalyst.auth();
    const authUser = await auth.createUser({
      email:     value.email,
      firstName: value.fullName.split(' ')[0],
      lastName:  value.fullName.split(' ').slice(1).join(' '),
    });
    catalystUid = authUser.user_id;
  } catch (e) {
    console.error('Catalyst Auth user creation failed:', e.message);
    catalystUid = `dev_${Date.now()}`;
  }

  const datastore = catalyst.datastore();
  const newUser   = await datastore.table('Users').insertRow({
    catalyst_uid:    catalystUid,
    employee_id:     value.employeeId,
    full_name:       value.fullName,
    email:           value.email,
    phone:           value.phone,
    role:            value.role,
    district_id:     value.districtId,
    station_id:      value.stationId,
    lang_preference: value.lang,
    status:          'active',
    password_hash:   passwordHash,
  });

  // Send welcome email
  try {
    const mail = catalyst.mail();
    await mail.send({
      from:    'noreply@ciap.ksp.gov.in',
      to:      value.email,
      subject: 'Welcome to KSP CIAP — Account Created',
      content: `Dear ${value.fullName}, your CIAP account has been created. Role: ${value.role}. Please login at https://ciap.ksp.gov.in`,
    });
  } catch (e) { console.error('Welcome email failed:', e.message); }

  sendSuccess(res, { userId: newUser.user_id, employeeId: value.employeeId, email: value.email }, {}, 201);
}));

// ── PUT /api/admin/users/:id ──────────────────────────────────────────────────
router.put('/users/:id', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const userId  = parseInt(req.params.id);
  const allowed = ['role', 'status', 'districtId', 'stationId', 'phone', 'langPreference'];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      const dbField = field.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      updates[dbField] = req.body[field];
    }
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, error: 'No valid fields to update' });
  }
  const datastore = catalyst.datastore();
  await datastore.table('Users').updateRow({ user_id: userId, ...updates });
  sendSuccess(res, { userId, updated: Object.keys(updates) });
}));

// ── GET /api/admin/audit ──────────────────────────────────────────────────────
router.get('/audit', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const { perPage, offset } = paginate(req.query);
  const { userId, action, dateFrom } = req.query;

  let where = ['1=1'];
  if (userId)   where.push(`al.user_id = ${parseInt(userId)}`);
  if (action)   where.push(`al.action LIKE '%${action.replace(/'/g,"''")}%'`);
  if (dateFrom) where.push(`al.created_at >= '${dateFrom}'`);

  const datastore = catalyst.datastore();
  const result    = await datastore.table('AuditLog').query(
    `SELECT al.*, u.full_name AS user_name, u.email AS user_email
     FROM AuditLog al
     LEFT JOIN Users u ON al.user_id = u.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY al.created_at DESC
     LIMIT ${perPage} OFFSET ${offset}`
  ).catch(() => []);

  sendSuccess(res, result.map(r => ({
    logId:        r.AuditLog.log_id,
    userId:       r.AuditLog.user_id,
    userName:     r.Users?.full_name,
    userEmail:    r.Users?.email,
    action:       r.AuditLog.action,
    resourceType: r.AuditLog.resource_type,
    resourceId:   r.AuditLog.resource_id,
    ipAddress:    r.AuditLog.ip_address,
    createdAt:    r.AuditLog.created_at,
  })));
}));

// ── GET /api/admin/districts ──────────────────────────────────────────────────
router.get('/districts', asyncHandler(async (req, res) => {
  const datastore = catalyst.datastore();
  const result    = await datastore.table('District').query(
    `SELECT d.*,
            COUNT(DISTINCT s.station_id) AS station_count,
            COUNT(DISTINCT u.user_id) AS officer_count
     FROM District d
     LEFT JOIN Station s ON s.district_id = d.district_id
     LEFT JOIN Users u   ON u.district_id = d.district_id
     WHERE d.is_active = 1
     GROUP BY d.district_id
     ORDER BY d.name_en ASC`
  ).catch(() => []);

  sendSuccess(res, result.map(r => ({
    districtId:    r.District.district_id,
    code:          r.District.code,
    nameEn:        r.District.name_en,
    nameKn:        r.District.name_kn,
    division:      r.District.division,
    lat:           parseFloat(r.District.hq_lat),
    lng:           parseFloat(r.District.hq_lng),
    stationCount:  parseInt(r['COUNT(DISTINCT s.station_id)'] || 0),
    officerCount:  parseInt(r['COUNT(DISTINCT u.user_id)'] || 0),
  })));
}));

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', requireRole('district_officer'), asyncHandler(async (req, res) => {
  const datastore = catalyst.datastore();
  const [users, districts, stations] = await Promise.all([
    datastore.table('Users').query('SELECT COUNT(*) AS cnt, role FROM Users GROUP BY role').catch(() => []),
    datastore.table('District').query('SELECT COUNT(*) AS cnt FROM District WHERE is_active=1').catch(() => []),
    datastore.table('Station').query('SELECT COUNT(*) AS cnt FROM Station WHERE is_active=1').catch(() => []),
  ]);

  sendSuccess(res, {
    usersByRole:   Object.fromEntries(users.map(r => [r.Users.role, r['COUNT(*)'] || r.cnt])),
    totalDistricts:parseInt(districts[0]?.['COUNT(*)'] || 30),
    totalStations: parseInt(stations[0]?.['COUNT(*)'] || 600),
  });
}));

module.exports = router;
