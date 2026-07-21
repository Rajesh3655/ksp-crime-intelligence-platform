'use strict';

const requestLogger = (req, _res, next) => {
  req.requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  console.log(`[${req.requestId}] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = { requestLogger };
