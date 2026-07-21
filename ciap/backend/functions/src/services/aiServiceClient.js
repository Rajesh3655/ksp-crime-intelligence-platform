'use strict';

const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

const callAiService = async (path, payload, timeoutMs = 30000) => {
  if (!AI_SERVICE_URL) return null;
  try {
    const response = await axios.post(`${AI_SERVICE_URL.replace(/\/$/, '')}${path}`, payload, {
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'X-CIAP-Service': 'catalyst-functions',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`[ai-service] ${path} failed:`, error.message);
    return null;
  }
};

module.exports = { callAiService };
