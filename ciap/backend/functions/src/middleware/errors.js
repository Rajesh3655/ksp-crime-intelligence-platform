/**
 * Error Handling Middleware & Request Logger
 */
'use strict';

const winston = require('winston');

// ── Logger ───────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method:     req.method,
      path:       req.path,
      status:     res.statusCode,
      duration_ms: duration,
      user_id:    req.user?.userId,
      ip:         req.ip,
    });
  });
  next();
};

// ── Error Handler ─────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, _next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
    user_id: req.user?.userId,
  });

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details.map(d => ({ field: d.path.join('.'), message: d.message })),
    });
  }

  // Catalyst SDK errors
  if (err.code === 'CATALYST_ERROR') {
    return res.status(502).json({
      success: false,
      error: 'Catalyst service error',
      code: err.code,
    });
  }

  // Default 500
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An internal error occurred. Please contact support.'
      : err.message,
  });
};

// ── Async wrapper ─────────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Pagination helper ─────────────────────────────────────────────────────────
const paginate = (query) => {
  const page    = Math.max(1, parseInt(query.page  || '1'));
  const perPage = Math.min(100, parseInt(query.per_page || '20'));
  const offset  = (page - 1) * perPage;
  return { page, perPage, offset };
};

// ── Success response ──────────────────────────────────────────────────────────
const sendSuccess = (res, data, meta = {}, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
};

module.exports = { requestLogger, errorHandler, asyncHandler, paginate, sendSuccess, logger };
