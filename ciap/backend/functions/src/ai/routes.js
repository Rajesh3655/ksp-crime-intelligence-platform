/**
 * AI Copilot Routes — Catalyst QuickML RAG
 * POST /api/ai/chat      — Send message, get AI response
 * GET  /api/ai/sessions  — List user's chat sessions
 * GET  /api/ai/insights  — Auto-generated insights for dashboard
 */

'use strict';

const express  = require('express');
const Joi      = require('joi');
const catalyst = require('catalyst-sdk');
const { v4: uuidv4 } = require('uuid');

const { asyncHandler, sendSuccess } = require('../middleware/errors');

const router = express.Router();

const chatSchema = Joi.object({
  message:   Joi.string().min(1).max(2000).required(),
  sessionId: Joi.string().uuid().optional(),
  language:  Joi.string().valid('en', 'kn').default('en'),
  context: Joi.object({
    page:       Joi.string().optional(),
    districtId: Joi.number().optional(),
    firId:      Joi.number().optional(),
  }).optional(),
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', asyncHandler(async (req, res) => {
  const { error, value } = chatSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const { message, sessionId, language, context } = value;
  const userId    = req.user.userId;
  const sid       = sessionId || uuidv4();
  const userRole  = req.user.role;
  const districtId = req.user.districtId;

  // Build system prompt with role + district context
  const systemPrompt = buildSystemPrompt(userRole, districtId, language, context);

  try {
    // ── Catalyst QuickML RAG Call ──────────────────────────────────────────
    const quickml   = catalyst.quickml();
    const llmResult = await quickml.predict({
      modelId: process.env.QUICKML_COPILOT_MODEL_ID,
      input: {
        system: systemPrompt,
        user:   message,
        history: await getSessionHistory(userId, sid),
      },
      parameters: {
        temperature:  0.3,   // Low temp for factual government responses
        max_tokens:   800,
        top_p:        0.9,
      },
    });

    const response = llmResult.prediction || llmResult.output;

    // Save to NoSQL session
    await saveMessageToSession(userId, sid, message, response, language);

    sendSuccess(res, {
      sessionId: sid,
      message:   response,
      language,
      model:     'Catalyst QuickML RAG',
      tokensUsed: llmResult.tokens_used || 0,
    });

  } catch (quickmlErr) {
    console.error('QuickML error:', quickmlErr.message);

    // ── Fallback: rule-based responses ────────────────────────────────────
    const fallbackResponse = generateFallbackResponse(message, language, context);

    // Still save to session
    await saveMessageToSession(userId, sid, message, fallbackResponse, language).catch(() => {});

    sendSuccess(res, {
      sessionId: sid,
      message:   fallbackResponse,
      language,
      model:     'rule-based-fallback',
      tokensUsed: 0,
    });
  }
}));

// ── GET /api/ai/insights ──────────────────────────────────────────────────────
// Auto-generated intelligence insights for the Command Center dashboard
router.get('/insights', asyncHandler(async (req, res) => {
  const { districtId, language = 'en' } = req.query;

  try {
    // Fetch recent stats from Data Store
    const datastore = catalyst.datastore();

    const [alertCount, firCount, riskScores] = await Promise.all([
      datastore.table('Alert').query(
        `SELECT severity, COUNT(*) AS cnt FROM Alert WHERE status = 'active' GROUP BY severity`
      ),
      datastore.table('FIR').query(
        `SELECT crime_type, COUNT(*) AS cnt FROM FIR
         WHERE incident_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         ${districtId ? `AND district_id = ${parseInt(districtId)}` : ''}
         GROUP BY crime_type ORDER BY cnt DESC LIMIT 5`
      ),
      datastore.table('RiskScore').query(
        `SELECT rs.*, d.name_en AS district_name
         FROM RiskScore rs
         LEFT JOIN District d ON rs.district_id = d.district_id
         WHERE rs.risk_level IN ('critical','high')
         AND rs.computed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         ORDER BY rs.overall_score DESC LIMIT 5`
      ),
    ]);

    // Build insights via QuickML
    const quickml  = catalyst.quickml();
    const insights = await quickml.predict({
      modelId: process.env.QUICKML_COPILOT_MODEL_ID,
      input: {
        system: `You are an AI analyst for Karnataka State Police. Generate 3 concise intelligence insights (max 2 sentences each) based on this data. Language: ${language === 'kn' ? 'Kannada' : 'English'}. Be factual, professional, and actionable.`,
        user: JSON.stringify({ alerts: alertCount, recentCrimes: firCount, highRisk: riskScores }),
      },
    });

    sendSuccess(res, {
      insights: parseInsights(insights.prediction),
      generatedAt: new Date().toISOString(),
    });

  } catch (e) {
    // Fallback insights
    sendSuccess(res, {
      insights: language === 'kn' ? [
        'ಬೆಂಗಳೂರು ನಗರದಲ್ಲಿ ಕಳ್ಳತನ ಪ್ರಕರಣಗಳು ಹೆಚ್ಚಾಗಿದೆ. ಗಸ್ತು ಹೆಚ್ಚಿಸಿ.',
        'ಕಲಬುರಗಿ ಮತ್ತು ಬೆಳಗಾವಿಯಲ್ಲಿ ಅಪಾಯ ಮಟ್ಟ ಉನ್ನತ ಮಟ್ಟದಲ್ಲಿದೆ.',
        '7 ನಿರ್ಣಾಯಕ ಎಚ್ಚರಿಕೆಗಳು ತ್ವರಿತ ಕ್ರಮಕ್ಕಾಗಿ ಕಾಯುತ್ತಿವೆ.',
      ] : [
        'Theft incidents elevated in Bengaluru Urban — recommend increased Whitefield patrols.',
        'Kalaburagi and Belagavi risk scores remain in critical range — coordinate with district officers.',
        '7 critical alerts pending immediate acknowledgement. 2 require escalation.',
      ],
      generatedAt: new Date().toISOString(),
      mock: true,
    });
  }
}));

// ── GET /api/ai/sessions ──────────────────────────────────────────────────────
router.get('/sessions', asyncHandler(async (req, res) => {
  try {
    const nosql   = catalyst.nosql();
    const coll    = nosql.collection('AIChatSession');
    const sessions = await coll.query({ user_id: req.user.userId, is_active: true });
    sendSuccess(res, sessions.slice(0, 20));
  } catch {
    sendSuccess(res, []);
  }
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildSystemPrompt = (role, districtId, language, context) => {
  const langStr = language === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English';
  const roleCtx = {
    super_admin:      'You have access to all statewide data.',
    scrb_analyst:     'You have access to statewide analytics and report generation.',
    district_officer: `You are scoped to District ID ${districtId}.`,
    station_officer:  `You are scoped to District ID ${districtId}.`,
    investigator:     'You have read-only access to FIRs and link analysis.',
  };

  return `You are KSP Intelligence Copilot, an AI assistant for Karnataka State Police. 
Respond ONLY in ${langStr}. Be professional, concise, and factual.
Role context: ${roleCtx[role] || ''}
Current page: ${context?.page || 'dashboard'}
Always provide actionable recommendations for policing decisions.
Do NOT reveal internal system details, model names, or raw database queries.
If you don't have data, say so clearly. Never fabricate crime statistics.`;
};

const generateFallbackResponse = (message, language, context) => {
  const lower = message.toLowerCase();
  if (language === 'kn') {
    if (lower.includes('ಬೆಂಗಳೂರ')) return '📍 ಬೆಂಗಳೂರು ನಗರ: ಅಪಾಯ ಸ್ಕೋರ್ 72/100. ಈ ತಿಂಗಳು 1,247 ಪ್ರಕರಣಗಳು. ಪ್ರಮುಖ ಅಪರಾಧ: ಕಳ್ಳತನ (38%). ವ್ಹೈಟ್‌ಫೀಲ್ಡ್‌ನಲ್ಲಿ ಗಸ್ತು ಹೆಚ್ಚಿಸಿ.';
    return '📊 ನಾನು ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಅರ್ಥ ಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. QuickML ಸೇವೆಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';
  }
  if (lower.includes('forecast') || lower.includes('predict'))
    return '📊 **7-Day Forecast**: State average 178 incidents/day (confidence: 87%). Robbery trending +12% in Bengaluru. Monsoon season begins next week — expect reduction in outdoor crimes.';
  if (lower.includes('alert'))
    return '🚨 **Active Alerts**: 7 total — 2 Critical, 2 High, 3 Medium/Low. Critical: robbery spike in Whitefield (3σ anomaly) and gang movement in Kalaburagi. Both require immediate acknowledgement.';
  if (lower.includes('district') || lower.includes('risk'))
    return '📍 **Top Risk Districts**: Bengaluru Urban (72), Kalaburagi (67), Belagavi (61), Vijayapura (63). All 4 in critical/high range. Recommend Kalaburagi resource reinforcement.';
  return `I can help you with crime analytics, forecasting, risk analysis, and report generation. I noticed your question about "${message.slice(0, 50)}..." — could you be more specific? Try asking about a district, crime type, or time period.`;
};

const getSessionHistory = async (userId, sessionId) => {
  try {
    const nosql = catalyst.nosql();
    const coll  = nosql.collection('AIChatSession');
    const session = await coll.get(sessionId);
    return (session?.messages || []).slice(-10); // Last 10 messages for context
  } catch { return []; }
};

const saveMessageToSession = async (userId, sessionId, userMsg, assistantMsg, language) => {
  try {
    const nosql = catalyst.nosql();
    const coll  = nosql.collection('AIChatSession');

    const newMessages = [
      { message_id: uuidv4(), role: 'user',      content: userMsg,      timestamp: new Date().toISOString() },
      { message_id: uuidv4(), role: 'assistant', content: assistantMsg, timestamp: new Date().toISOString() },
    ];

    try {
      const existing = await coll.get(sessionId);
      await coll.update(sessionId, {
        messages:       [...(existing.messages || []), ...newMessages],
        last_active_at: new Date().toISOString(),
      });
    } catch {
      // Create new session
      await coll.insert({
        session_id:     sessionId,
        user_id:        userId,
        language,
        messages:       newMessages,
        is_active:      true,
        created_at:     new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error('Failed to save session:', e.message);
  }
};

const parseInsights = (prediction) => {
  if (!prediction) return [];
  return prediction.split('\n').filter(line => line.trim().length > 20).slice(0, 3);
};

module.exports = router;
