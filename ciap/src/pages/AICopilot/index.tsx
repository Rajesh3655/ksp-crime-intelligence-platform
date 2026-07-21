import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Mic, Volume2, Sparkles, RotateCcw, BookOpen, BarChart3, Map, TrendingUp, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import { askCopilot } from '../../data/intelligence';
import { ExplainableAICard } from '../../components/intelligence/EnterprisePanels';

const EXAMPLES = [
  'What districts have the highest crime rates this month?',
  'Explain the forecast model accuracy',
  'Show me robbery trends in Bengaluru Urban',
  'Generate an intelligence brief for Kalaburagi district',
  'Which stations are understaffed based on crime density?',
  'Find similar FIRs.',
  'Show top gangs.',
  'Who is connected to A1?',
  'ಬೆಂಗಳೂರಿನಲ್ಲಿ ಅಧಿಕ ಅಪಾಯದ ಪ್ರದೇಶಗಳನ್ನು ತೋರಿಸಿ',
  'ಇಂದಿನ ಮುನ್ಸೂಚನೆ ಏನು?',
];

interface Message { id: string; role: 'user' | 'assistant'; text: string; }

const AICopilotPage: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', text: t('ai_greeting') }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
    setInput('');
    setTyping(true);
    const response = await askCopilot(text, t('platform_name') === 'ಸಿಐಎಪಿ' ? 'kn' : 'en');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: String(response) }]);
      setTyping(false);
    }, 300);
  };

  return (
    <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('ai_title')}</h1>
          <p className="page-subtitle">Context-aware intelligence assistant powered by Catalyst QuickML RAG</p>
        </div>
        <div className="page-header-actions">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-caption text-muted">QuickML · Online</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessages([{ id: '0', role: 'assistant', text: t('ai_greeting') }])}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid grid-4 mb-6">
        {[
          { icon: <BarChart3 size={18} />, label: 'Crime Analytics', desc: 'Query any crime metric' },
          { icon: <TrendingUp size={18} />, label: 'Forecasting', desc: 'Explain AI predictions' },
          { icon: <Map size={18} />, label: 'Geo Analysis', desc: 'Hotspot identification' },
          { icon: <BookOpen size={18} />, label: 'Report Generation', desc: 'Auto-generate reports' },
        ].map(cap => (
          <motion.div key={cap.label} className="card card-sm" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }} whileHover={{ y: -2 }}>
            <div style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}>{cap.icon}</div>
            <div>
              <div className="text-sm" style={{ fontWeight: 600 }}>{cap.label}</div>
              <div className="text-caption text-muted">{cap.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-2 mb-6">
        <ExplainableAICard
          title="Context Memory"
          prediction="Conversation is scoped to current page, selected district, and FIR context"
          confidence={92}
          features={['Natural language intents', 'English/Kannada support', 'Citations to CaseMaster and IntelligenceFinding']}
          recommendation="Ask for charts, maps, graphs, predictions, or SCRB report generation in one prompt."
        />
        <div className="intel-card">
          <div className="intel-card-header">
            <div className="intel-title"><Network size={15} /> Interactive Response Types</div>
            <button className="btn btn-ghost btn-sm"><Volume2 size={13} /> Voice</button>
          </div>
          {['Inline chart', 'Map overlay', 'Graph focus', 'Prediction card', 'Citation drawer'].map(item => (
            <div key={item} className="intel-row"><Sparkles size={12} /> {item}</div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 480 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}>
              {msg.role === 'assistant' && (
                <div className="ai-avatar" style={{ flexShrink: 0, marginTop: 2 }}><Sparkles size={14} /></div>
              )}
              <motion.div
                className="ai-message-bubble"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  maxWidth: '80%',
                  background: msg.role === 'user' ? 'var(--info-bg)' : 'var(--navy-800)',
                  border: msg.role === 'user' ? '1px solid var(--info-border)' : '1px solid var(--border-subtle)',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                  padding: '12px 16px',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
              />
            </div>
          ))}
          {typing && (
            <div className="flex items-start gap-3">
              <div className="ai-avatar"><Sparkles size={14} /></div>
              <div className="ai-message-bubble" style={{ background: 'var(--navy-800)', border: '1px solid var(--border-subtle)', borderRadius: '4px 12px 12px 12px', padding: '12px 16px' }}>
                <div className="flex items-center gap-2">
                  <span className="text-caption text-muted">{t('ai_typing')}</span>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block', animation: `dot 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Example prompts */}
        <div style={{ padding: '0 var(--space-6) var(--space-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
          <div className="text-label text-muted mb-2">Suggested queries</div>
          <div className="flex wrap gap-2">
            {EXAMPLES.slice(0, 8).map(e => (
              <button key={e} className="ai-chip" onClick={() => sendMessage(e)} style={{ fontSize: 11 }}>
                {e.length > 48 ? e.slice(0, 47) + '…' : e}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
          <input
            className="input flex-1"
            placeholder={t('ai_placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            id="ai-page-input"
          />
          <button className="btn btn-ghost btn-icon" title={t('ai_voice')} aria-label="Voice input"><Mic size={16} /></button>
          <button className="btn btn-primary" onClick={() => sendMessage(input)} disabled={!input.trim()} id="ai-page-send">
            <Send size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dot { 0%,80%,100% { opacity:0.2; transform:translateY(0); } 40% { opacity:1; transform:translateY(-3px); } }
      `}</style>
    </div>
  );
};

export default AICopilotPage;
