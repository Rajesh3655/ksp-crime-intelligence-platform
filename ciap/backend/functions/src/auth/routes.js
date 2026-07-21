/**
 * Authentication Routes
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 * PUT  /api/auth/language
 */

'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Joi      = require('joi');
const catalyst = require('catalyst-sdk');

const { asyncHandler, sendSuccess } = require('../middleware/errors');
const { authenticateToken }         = require('../middleware/auth');

const router = express.Router();

// ── Validation schemas ────────────────────────────────────────────────────────
const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const langSchema = Joi.object({
  language: Joi.string().valid('en', 'kn').required(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET  = () => process.env.JWT_SECRET || 'ciap-dev-secret-change-in-production';
const JWT_EXPIRES = '8h'; // Shift-length JWT expiry
const DEMO_EMAIL = 'ramaiah@ksp.gov.in';
const DEMO_PASSWORD = process.env.CIAP_DEMO_PASSWORD || 'Ksp@12345';

const generateToken = (user) => jwt.sign(
  {
    userId:     user.user_id,
    employeeId: user.employee_id,
    role:       user.role,
    districtId: user.district_id,
    stationId:  user.station_id,
    email:      user.email,
    lang:       user.lang_preference,
  },
  JWT_SECRET(),
  { expiresIn: JWT_EXPIRES, issuer: 'ciap.ksp.gov.in' }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const { email, password } = value;

  try {
    const datastore = catalyst.datastore();
    const table     = datastore.table('Users');

    // Fetch user by email
    const result = await table.query(
      `SELECT * FROM Users WHERE email = '${email.replace(/'/g, "''")}' AND status = 'active' LIMIT 1`
    );

    if (!result || result.length === 0) {
      // Generic message to prevent email enumeration
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result[0].Users;

    // Verify password (stored as bcrypt hash)
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last_login_at
    await table.updateRow({
      user_id:       user.user_id,
      last_login_at: new Date().toISOString(),
    });

    const token = generateToken(user);

    sendSuccess(res, {
      token,
      expiresIn: JWT_EXPIRES,
      user: {
        userId:     user.user_id,
        employeeId: user.employee_id,
        name:       user.full_name,
        email:      user.email,
        role:       user.role,
        districtId: user.district_id,
        stationId:  user.station_id,
        lang:       user.lang_preference,
        status:     user.status,
      },
    });
  } catch (catalystErr) {
    // Fallback for dev/demo when Catalyst is not configured
    if (process.env.NODE_ENV === 'development' && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const mockUser = {
        userId: 1, employeeId: 'KSP-SA-0001',
        name: 'Supt. Ramaiah K.', email, role: 'super_admin',
        districtId: null, stationId: null, lang: 'en', status: 'active',
      };
      const token = jwt.sign(
        { ...mockUser, userId: 1 },
        JWT_SECRET(),
        { expiresIn: JWT_EXPIRES }
      );
      return sendSuccess(res, { token, expiresIn: JWT_EXPIRES, user: mockUser });
    }
    throw catalystErr;
  }
}));

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Catalyst Auth: invalidate session
  // In JWT-only mode, client just discards the token
  // For server-side invalidation, add token to a deny-list in Catalyst Cache
  try {
    const cache = catalyst.cache();
    const denyKey = `jwt_deny:${req.headers.authorization?.slice(7)}`;
    await cache.put(denyKey, '1', 8 * 60 * 60); // 8 hour TTL matches JWT expiry
  } catch {
    // Cache failure should not block logout
  }

  sendSuccess(res, { message: 'Logged out successfully' });
}));

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.user;

  try {
    const datastore = catalyst.datastore();
    const result    = await datastore.table('Users').query(
      `SELECT u.*, d.name_en AS district_name, s.name_en AS station_name
       FROM Users u
       LEFT JOIN District d ON u.district_id = d.district_id
       LEFT JOIN Station s ON u.station_id = s.station_id
       WHERE u.user_id = ${userId} LIMIT 1`
    );

    if (!result?.length) return res.status(404).json({ success: false, error: 'User not found' });

    const u = result[0].Users;
    sendSuccess(res, {
      userId:       u.user_id,
      employeeId:   u.employee_id,
      name:         u.full_name,
      email:        u.email,
      role:         u.role,
      districtId:   u.district_id,
      districtName: result[0].District?.name_en,
      stationId:    u.station_id,
      stationName:  result[0].Station?.name_en,
      lang:         u.lang_preference,
      lastLoginAt:  u.last_login_at,
    });
  } catch {
    // Dev fallback
    sendSuccess(res, req.user);
  }
}));

// ── PUT /api/auth/language ────────────────────────────────────────────────────
router.put('/language', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = langSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  try {
    const datastore = catalyst.datastore();
    await datastore.table('Users').updateRow({
      user_id:         req.user.userId,
      lang_preference: value.language,
    });
  } catch {
    // Non-critical — client will store preference locally too
  }

  sendSuccess(res, { language: value.language, message: 'Language preference updated' });
}));

module.exports = router;
