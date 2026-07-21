/**
 * Data Ingestion Engine
 * POST /api/ingest/csv      — Upload & process CSV
 * POST /api/ingest/excel    — Upload & process Excel
 * POST /api/ingest/cctns    — Trigger CCTNS sync
 * GET  /api/ingest/batches  — List ingestion batches
 * GET  /api/ingest/batches/:id — Batch status
 */

'use strict';

const express    = require('express');
const multer     = require('multer');
const csv        = require('csv-parser');
const XLSX       = require('xlsx');
const { Readable } = require('stream');
const catalyst   = require('catalyst-sdk');
const { v4: uuidv4 } = require('uuid');

const { asyncHandler, sendSuccess, paginate } = require('../middleware/errors');
const { requireRole }                         = require('../middleware/auth');

const router  = express.Router();

// Use memory storage; files go to Catalyst Stratus
const upload  = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv', 'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xls|xlsx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  },
});

// ── Column mapping for FIR CSV format ─────────────────────────────────────────
const FIR_COLUMN_MAP = {
  'FIR Number':    'fir_number',
  'District':      'district_name',
  'Station':       'station_name',
  'Crime Type':    'crime_type',
  'Category':      'crime_category',
  'Severity':      'severity',
  'Date':          'incident_date',
  'Latitude':      'lat',
  'Longitude':     'lng',
  'Description':   'description',
  'Status':        'status',
};

// ── POST /api/ingest/csv ──────────────────────────────────────────────────────
router.post('/csv', requireRole('scrb_analyst'), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

  const batchId = uuidv4();
  const rows    = [];

  // Parse CSV in memory
  await new Promise((resolve, reject) => {
    const stream = Readable.from(req.file.buffer);
    stream.pipe(csv())
      .on('data', (data) => rows.push(normalizeRow(data, FIR_COLUMN_MAP)))
      .on('end', resolve)
      .on('error', reject);
  });

  // Upload file to Catalyst Stratus for audit trail
  let storageUrl = null;
  try {
    const stratus = catalyst.stratus();
    const folder  = await stratus.getFolder('ingestion-uploads');
    const fileObj = await folder.uploadFile({
      code:     batchId,
      name:     req.file.originalname,
      content:  req.file.buffer,
      mimeType: req.file.mimetype,
    });
    storageUrl = fileObj.file_location;
  } catch {
    console.error('Stratus upload failed:', e.message);
  }

  // Create batch record
  const datastore = catalyst.datastore();
  await datastore.table('IngestionBatch').insertRow({
    batch_id:      batchId,
    source:        'csv',
    filename:      req.file.originalname,
    storage_url:   storageUrl,
    status:        'processing',
    total_records: rows.length,
    uploaded_by:   req.user.userId,
  });

  // Process records asynchronously via Catalyst Signal
  try {
    const signals = catalyst.signals();
    await signals.publish('INGESTION_BATCH_READY', {
      batchId,
      source: 'csv',
      records: rows,
      uploadedBy: req.user.userId,
    });
  } catch {
    console.error('Signal publish error:', e.message);
  }

  sendSuccess(res, {
    batchId,
    totalRecords: rows.length,
    status: 'processing',
    message: 'File uploaded. Processing via Catalyst Circuits. Check batch status for progress.',
  }, {}, 202);
}));

// ── POST /api/ingest/excel ────────────────────────────────────────────────────
router.post('/excel', requireRole('scrb_analyst'), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

  const batchId  = uuidv4();
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows  = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const rows     = rawRows.map(r => normalizeRow(r, FIR_COLUMN_MAP));

  const { error, validRows } = validateRows(rows);

  const datastore = catalyst.datastore();
  await datastore.table('IngestionBatch').insertRow({
    batch_id:      batchId,
    source:        'excel',
    filename:      req.file.originalname,
    status:        'processing',
    total_records: rows.length,
    uploaded_by:   req.user.userId,
    error_log:     JSON.stringify(error),
  });

  // Trigger processing circuit
  try {
    const signals = catalyst.signals();
    await signals.publish('INGESTION_BATCH_READY', { batchId, records: validRows, source: 'excel' });
  } catch (e) { console.error('Signal error:', e.message); }

  sendSuccess(res, {
    batchId,
    totalRecords: rows.length,
    validRecords: validRows.length,
    invalidRecords: rows.length - validRows.length,
    errors: error.slice(0, 10),
    status: 'processing',
  }, {}, 202);
}));

// ── POST /api/ingest/cctns ────────────────────────────────────────────────────
// Trigger CCTNS sync via Catalyst Connections
router.post('/cctns', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const { syncType = 'incremental', districtId, dateFrom } = req.body;

  // Use Catalyst Connections for CCTNS OAuth
  try {
    const connections = catalyst.connections();
    const cctnsConn   = await connections.getConnection('CCTNS_OAUTH');
    const accessToken = await cctnsConn.getAccessToken();

    // Publish sync signal
    const signals = catalyst.signals();
    await signals.publish('CCTNS_SYNC_REQUESTED', {
      syncType,
      districtId,
      dateFrom,
      accessToken,
      requestedBy: req.user.userId,
    });

    sendSuccess(res, {
      message: `CCTNS ${syncType} sync initiated`,
      syncType,
      estimatedDuration: '5–15 minutes',
    }, {}, 202);
  } catch {
    // CCTNS not configured
    sendSuccess(res, {
      message: 'CCTNS connection not configured. Configure via Catalyst Connections.',
      hint: 'Set up CCTNS_OAUTH in Catalyst Connections panel',
    }, {}, 200);
  }
}));

// ── GET /api/ingest/batches ───────────────────────────────────────────────────
router.get('/batches', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const { perPage, offset } = paginate(req.query);

  const datastore = catalyst.datastore();
  const result = await datastore.table('IngestionBatch').query(
    `SELECT ib.*, u.full_name AS uploaded_name
     FROM IngestionBatch ib
     LEFT JOIN Users u ON ib.uploaded_by = u.user_id
     ORDER BY ib.created_at DESC
     LIMIT ${perPage} OFFSET ${offset}`
  );

  sendSuccess(res, result.map(r => ({
    batchId:          r.IngestionBatch.batch_id,
    source:           r.IngestionBatch.source,
    filename:         r.IngestionBatch.filename,
    status:           r.IngestionBatch.status,
    totalRecords:     r.IngestionBatch.total_records,
    processedRecords: r.IngestionBatch.processed_records,
    failedRecords:    r.IngestionBatch.failed_records,
    uploadedBy:       r.Users?.full_name,
    createdAt:        r.IngestionBatch.created_at,
    completedAt:      r.IngestionBatch.completed_at,
  })));
}));

// ── GET /api/ingest/batches/:id ───────────────────────────────────────────────
router.get('/batches/:id', requireRole('scrb_analyst'), asyncHandler(async (req, res) => {
  const batchId = req.params.id;
  const datastore = catalyst.datastore();
  const result = await datastore.table('IngestionBatch').query(
    `SELECT * FROM IngestionBatch WHERE batch_id = '${batchId}' LIMIT 1`
  );
  if (!result?.length) return res.status(404).json({ success: false, error: 'Batch not found' });
  sendSuccess(res, result[0].IngestionBatch);
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeRow = (row, columnMap) => {
  const normalized = {};
  for (const [csvCol, dbCol] of Object.entries(columnMap)) {
    if (row[csvCol] !== undefined) normalized[dbCol] = row[csvCol];
  }
  return normalized;
};

const validateRows = (rows) => {
  const required = ['fir_number', 'crime_type', 'incident_date'];
  const errors   = [];
  const validRows = [];

  rows.forEach((row, i) => {
    const missing = required.filter(f => !row[f]);
    if (missing.length) {
      errors.push({ row: i + 1, missing, fir_number: row.fir_number || 'N/A' });
    } else {
      validRows.push(row);
    }
  });

  return { error: errors, validRows };
};

module.exports = router;
