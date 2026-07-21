/**
 * Authentication Middleware
 * JWT verification + RBAC enforcement using Catalyst Authentication
 */

'use strict';

const jwt      = require('jsonwebtoken');
const catalyst = require('catalyst-sdk');

// Role hierarchy (higher = more privileges)
const ROLE_HIERARCHY = {
  administrator:    10,
  super_admin:      10,
  dgp:              9,
  adgp:             8,
  igp:              7,
  dig:              6,
  sp:               5,
  scrb_analyst:     5,
  district_officer: 5,
  dsp:              4,
  inspector:        3,
  station_officer:  3,
  investigator:     3,
  constable:        1,
};

const DEMO_BYPASS_ENABLED =
  process.env.CIAP_DEMO_BYPASS === 'true' || process.env.NODE_ENV === 'development';
const DEMO_TOKEN = 'ciap-demo-token';
const DEMO_USER = {
  userId: 1,
  employeeId: 'KSP-SA-0001',
  role: 'super_admin',
  districtId: null,
  stationId: null,
  email: 'ramaiah@ksp.gov.in',
  lang: 'en',
};

/**
 * Verify JWT and attach user to req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (DEMO_BYPASS_ENABLED) {
        req.user = { ...DEMO_USER };
        return next();
      }
      return res.status(401).json({ success: false, error: 'Authentication token required' });
    }

    if (DEMO_BYPASS_ENABLED && token === DEMO_TOKEN) {
      req.user = { ...DEMO_USER };
      return next();
    }

    const secret = process.env.JWT_SECRET || 'ciap-dev-secret-change-in-production';
    const decoded = jwt.verify(token, secret);

    // Attach user info to request
    req.user = {
      userId:     decoded.userId,
      employeeId: decoded.employeeId,
      role:       decoded.role,
      districtId: decoded.districtId,
      stationId:  decoded.stationId,
      email:      decoded.email,
      lang:       decoded.lang || 'en',
    };

    // Write audit log asynchronously (non-blocking)
    logAccess(req).catch(err => console.error('Audit log error:', err));

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    }
    return res.status(500).json({ success: false, error: 'Authentication error.' });
  }
};

/**
 * Role-Based Access Control middleware factory
 * Usage: requireRole('district_officer') — allows that role AND above
 */
const requireRole = (minimumRole) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

  if (userLevel < requiredLevel) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Requires role: ${minimumRole} or above.`,
      yourRole: req.user.role,
    });
  }
  next();
};

/**
 * District scope enforcement — officers can only access their district
 * Super admins and SCRB analysts bypass this
 */
const requireDistrictScope = (req, res, next) => {
  const { role, districtId } = req.user;
  const bypassRoles = ['administrator', 'super_admin', 'dgp', 'adgp', 'igp', 'dig', 'scrb_analyst'];

  if (bypassRoles.includes(role)) return next();

  // If a districtId param is in the request, verify it matches
  const requestedDistrictId = parseInt(
    req.params.districtId || req.query.districtId || req.body.districtId
  );

  if (requestedDistrictId && requestedDistrictId !== districtId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access data for your assigned district.',
    });
  }

  // Inject district filter into query if not already scoped
  if (!req.query.districtId && districtId) {
    req.query.districtId = districtId.toString();
  }

  next();
};

/**
 * Write access audit log to Catalyst Data Store
 */
const logAccess = async (req) => {
  // Only log write operations
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;

  try {
    const datastore = catalyst.datastore();
    const table     = datastore.table('AuditLog');

    await table.insertRow({
      user_id:       req.user.userId,
      action:        `${req.method} ${req.path}`,
      resource_type: req.path.split('/')[3] || 'unknown',
      resource_id:   req.params.id || null,
      ip_address:    req.ip || req.connection.remoteAddress,
      user_agent:    req.headers['user-agent'],
      session_id:    req.headers['x-session-id'] || null,
    });
  } catch (err) {
    // Audit failures should never break the main flow
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = { authenticateToken, requireRole, requireDistrictScope };
