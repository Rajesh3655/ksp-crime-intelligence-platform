import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, X, Send, Mic, RotateCcw, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const PAGE_CHIPS: Record<string, string[]> = {
  '/': ['ai_chip_summary', 'ai_chip_alerts', 'ai_chip_hotspots'],
  '/command-center': ['ai_chip_summary', 'ai_chip_alerts', 'ai_chip_hotspots'],
  '/heatmap': ['ai_chip_hotspots', 'ai_chip_risk', 'ai_chip_summary'],
  '/forecasting': ['ai_chip_forecast', 'ai_chip_summary', 'ai_chip_report'],
  '/risk': ['ai_chip_risk', 'ai_chip_hotspots', 'ai_chip_forecast'],
  '/alerts': ['ai_chip_alerts', 'ai_chip_summary', 'ai_chip_risk'],
  '/scrb-reports': ['ai_chip_report', 'ai_chip_summary', 'ai_chip_forecast'],
};

const AI_RESPONSES: Record<string, string> = {
  'Show hotspots': '📍 Current hotspots: **Bengaluru Urban** (Risk: 72), **Kalaburagi** (67), **Belagavi** (61), **Vijayapura** (63). Bengaluru Urban shows a 3σ anomaly in Whitefield zone. Recommend immediate preventive patrolling.',
  "Today's forecast": '📊 **7-Day Forecast Summary**: Statewide incidents predicted at 165–195 per day (confidence: 87%). Robbery expected to increase 12% in Bengaluru. Drug offences trending upward in Kalaburagi. Theft seasonally stable.',
  'Active alerts': '🚨 **7 Active Alerts**: 2 Critical — Robbery spike in Whitefield (3σ), Gang movement in Kalaburagi. 2 High — Missing child (Mysuru), Risk threshold breach (Belagavi). 3 Medium/Low. Recommend acknowledging ALT-001 and ALT-002 immediately.',
  'Crime summary': '📋 **State Overview (Today)**: 183 incidents (+12%), 4,821 open FIRs, 67 arrests. Top crime type: Theft (34%). Most affected: Bengaluru Urban (1,247 incidents MTD). Risk score: 64/100 (+3 from yesterday).',
  'Generate report': '📄 **Report Generation**: I can generate a Monthly Crime Report, SCRB Statistical Report, or Intelligence Briefing. Which report type and period do you need? You can also go to **SCRB Reports** → Generate Report for more options.',
  'Explain risk score': '⚠️ **Risk Score Explanation**: Current state risk: 64/100. Key factors: Crime Rate (40% weight) — elevated in 4 districts. Recidivism Rate (20%). Socioeconomic Indicators (25%). Infrastructure Gap (15%). Bengaluru Urban is the primary driver at 72/100.',
};

const AICopilot: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', text: t('ai_greeting') }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chips = (PAGE_CHIPS[location.pathname] || ['ai_chip_summary', 'ai_chip_alerts', 'ai_chip_report'])
    .map(k => t(k));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update greeting on lang change
  useEffect(() => {
    setMessages([{ id: '0', role: 'assistant', text: t('ai_greeting') }]);
  }, [i18n.language, t]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const response = AI_RESPONSES[text] || generateContextResponse(text, location.pathname);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: response };
      setMessages(prev => [...prev, aiMsg]);
      setTyping(false);
    }, 900);
  };

  const generateContextResponse = (query: string, path: string): string => {
    const lower = query.toLowerCase();
    if (lower.includes('fir') || lower.includes('incident'))
      return '📋 I found 183 recent incidents. Showing top results: INC-08741 (Robbery, Whitefield), INC-08739 (Assault, Hubballi), INC-08737 (Murder, Belagavi). Tap any incident to view full details.';
    if (lower.includes('district') || lower.includes('bengaluru'))
      return '📍 Bengaluru Urban: Risk Score 72 (High). 1,247 incidents MTD. 3,900 personnel deployed (93% utilization). Top crime: Theft (38%). Recommend increasing mobile patrol in Whitefield and KR Puram sectors.';
    if (lower.includes('arrest') || lower.includes('criminal'))
      return '🔍 67 arrests today (+8% from yesterday). Highest: Bengaluru Urban (31), Kalaburagi (12), Belagavi (9). Link Analysis shows 3 repeat offenders in Whitefield cluster. Recommend judicial remand review.';
    return `I can help with crime analytics, forecasting, risk analysis, and report generation. Could you be more specific about what you need? I have full context for the **${path.replace('/', '').replace('-', ' ')}** page.`;
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`ai-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Copilot"
        id="ai-copilot-fab"
        title={t('ai_title')}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* AI Panel */}
      {open && (
        <div className="ai-panel" role="dialog" aria-label="AI Intelligence Copilot" id="ai-copilot-panel">
          {/* Header */}
          <div className="ai-panel-header">
            <div className="ai-avatar"><Sparkles size={16} /></div>
            <div style={{ flex: 1 }}>
              <div className="ai-panel-title">{t('ai_title')}</div>
              <div className="ai-panel-subtitle">{t('ai_subtitle')}</div>
            </div>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setMessages([{ id: '0', role: 'assistant', text: t('ai_greeting') }])}
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RotateCcw size={13} />
            </button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)} aria-label="Close">
              <X size={14} />
            </button>
          </div>

          {/* Context chips */}
          <div className="ai-quick-chips">
            {chips.map(chip => (
              <button key={chip} className="ai-chip" onClick={() => sendMessage(chip)} id={`ai-chip-${chip.replace(/\s+/g, '-')}`}>
                {chip}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="ai-panel-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`ai-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 24, height: 24, background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={12} color="var(--info-light)" />
                  </div>
                )}
                <div
                  className="ai-message-bubble"
                  dangerouslySetInnerHTML={{
                    __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                  }}
                />
              </div>
            ))}
            {typing && (
              <div className="ai-message assistant">
                <div style={{ width: 24, height: 24, background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={12} color="var(--info-light)" />
                </div>
                <div className="ai-message-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>{t('ai_typing')}</span>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block', animation: `typing-dot 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-panel-input">
            <input
              type="text"
              placeholder={t('ai_placeholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              aria-label="AI message input"
              id="ai-message-input"
            />
            <button className="btn btn-ghost btn-icon btn-sm" title={t('ai_voice')} aria-label="Voice input">
              <Mic size={15} />
            </button>
            <button
              className="btn btn-primary btn-icon btn-sm"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              aria-label="Send message"
              id="ai-send-btn"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typing-dot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </>
  );
};

export default AICopilot;
