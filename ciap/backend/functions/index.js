/**
 * CIAP Backend — Catalyst Functions Entry Point
 * Routes all incoming requests to the appropriate module handler
 */

'use strict';

const catalyst = require('catalyst-sdk');
const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');

// Route modules
const authRoutes       = require('./src/auth/routes');
const crimeRoutes      = require('./src/crime/routes');
const alertRoutes      = require('./src/alerts/routes');
const forecastRoutes   = require('./src/forecasting/routes');
const riskRoutes       = require('./src/risk/routes');
const ingestionRoutes  = require('./src/ingestion/routes');
const reportRoutes     = require('./src/reports/routes');
const aiRoutes         = require('./src/ai/routes');
const citizenRoutes    = require('./src/citizen/routes');
const adminRoutes      = require('./src/admin/routes');

// Middleware
const { authenticateToken } = require('./src/middleware/auth');
const { requestLogger }     = require('./src/middleware/logger');
const { errorHandler }      = require('./src/middleware/errors');

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'https://ciap.ksp.gov.in',
    'https://ciap-staging.catalystserverless.in',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// ── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, error: 'Too many login attempts. Account temporarily locked.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// ── Health Check (no auth) ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'healthy',
    service: 'KSP CIAP Backend',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    region: process.env.CATALYST_REGION || 'IN',
  });
});

// ── Public Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Protected Routes (require JWT) ──────────────────────────────────────────
app.use('/api/crimes',      authenticateToken, crimeRoutes);
app.use('/api/alerts',      authenticateToken, alertRoutes);
app.use('/api/forecast',    authenticateToken, forecastRoutes);
app.use('/api/risk',        authenticateToken, riskRoutes);
app.use('/api/ingest',      authenticateToken, ingestionRoutes);
app.use('/api/reports',     authenticateToken, reportRoutes);
app.use('/api/ai',          authenticateToken, aiRoutes);
app.use('/api/citizen',     citizenRoutes);   // citizens don't need auth to submit
app.use('/api/citizen/admin', authenticateToken, citizenRoutes); // admin actions need auth
app.use('/api/admin',       authenticateToken, adminRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found', path: req.path });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Catalyst Function Export ─────────────────────────────────────────────────
module.exports = async (context, basicIO) => {
  basicIO.setOutput(200, 'CIAP Backend initialized');
};

// ── Local Development Server ─────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚔 CIAP Backend running on http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
  });
}

module.exports.app = app;
