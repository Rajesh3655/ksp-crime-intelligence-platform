import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Mic, Send, Globe, Bell, Shield, User, Key, RotateCcw, CheckCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [lang, setLang] = useState(i18n.language);
  const [notifs, setNotifs] = useState({ email: true, push: true, critical: true, weekly: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    i18n.changeLanguage(lang);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('settings_title')}</h1>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave} id="save-settings-btn">
            {saved ? <><CheckCircle size={13} /> Saved!</> : <>{t('settings_save')}</>}
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '200px 1fr', gap: 'var(--space-4)' }}>
        {/* Settings Nav */}
        <div className="card" style={{ padding: 'var(--space-2)', height: 'fit-content' }}>
          {[
            { key: 'profile', label: t('settings_profile'), icon: <User size={15} /> },
            { key: 'language', label: t('settings_language'), icon: <Globe size={15} /> },
            { key: 'notifications', label: t('settings_notifications'), icon: <Bell size={15} /> },
            { key: 'security', label: t('settings_security'), icon: <Shield size={15} /> },
            { key: 'api', label: t('settings_api'), icon: <Key size={15} /> },
          ].map(s => (
            <div
              key={s.key}
              className={`nav-item ${activeTab === s.key ? 'active' : ''}`}
              onClick={() => setActiveTab(s.key)}
              style={{ margin: '2px 0' }}
            >
              <span className="nav-icon">{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Settings Content */}
        <div className="card">
          {activeTab === 'profile' && (
            <div>
              <div className="text-h3 mb-6" style={{ fontWeight: 700 }}>{t('settings_profile')}</div>
              <div className="flex items-center gap-4 mb-6">
                <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--navy-700)', border: '2px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--accent-primary)' }}>RK</div>
                <div>
                  <div className="text-h4" style={{ fontWeight: 700 }}>Supt. Ramaiah K.</div>
                  <div className="text-caption text-muted">Super Admin · State HQ</div>
                </div>
              </div>
              {[
                { label: 'Full Name', value: 'Supt. Ramaiah K.' },
                { label: 'Email', value: 'ramaiah@ksp.gov.in' },
                { label: 'Employee ID', value: 'KSP-SA-0001' },
                { label: 'Phone', value: '+91 98765 43210' },
                { label: 'Role', value: 'Super Admin' },
                { label: 'District', value: 'State HQ, Bengaluru' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-4" style={{ marginBottom: 12 }}>
                  <label className="text-caption text-muted" style={{ width: 120, flexShrink: 0 }}>{f.label}</label>
                  <input className="input flex-1" defaultValue={f.value} readOnly style={{ maxWidth: 360 }} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'language' && (
            <div>
              <div className="text-h3 mb-6" style={{ fontWeight: 700 }}>{t('settings_language')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
                {[
                  { code: 'en', label: 'English', desc: 'All UI labels, reports, and AI responses in English', native: 'English' },
                  { code: 'kn', label: 'Kannada', desc: 'ಎಲ್ಲಾ UI ಲೇಬಲ್‌ಗಳು, ವರದಿಗಳು ಮತ್ತು AI ಉತ್ತರಗಳು ಕನ್ನಡದಲ್ಲಿ', native: 'ಕನ್ನಡ' },
                ].map(l => (
                  <div
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${lang === l.code ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                      background: lang === l.code ? 'var(--bg-selected)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 20 }}>{l.code === 'en' ? '🇬🇧' : '🇮🇳'}</span>
                        <span className="text-sm" style={{ fontWeight: 700 }}>{l.native}</span>
                      </div>
                      {lang === l.code && <CheckCircle size={16} color="var(--accent-primary)" />}
                    </div>
                    <div className="text-caption text-secondary">{l.desc}</div>
                  </div>
                ))}
              </div>
              <div className="alert-banner info mt-6" style={{ maxWidth: 400 }}>
                <Globe size={13} style={{ flexShrink: 0 }} />
                <div className="text-caption text-secondary">Language preference is saved per user and persists across sessions. AI Copilot will also respond in your preferred language.</div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <div className="text-h3 mb-6" style={{ fontWeight: 700 }}>{t('settings_notifications')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440 }}>
                {[
                  { key: 'email' as const, label: 'Email Notifications', desc: 'Receive alert notifications via Catalyst Mail' },
                  { key: 'push' as const, label: 'Push Notifications', desc: 'Browser and mobile push via Catalyst Push' },
                  { key: 'critical' as const, label: 'Critical Alerts Only', desc: 'Only trigger for severity: Critical alerts' },
                  { key: 'weekly' as const, label: 'Weekly Digest', desc: 'Weekly intelligence digest summary email' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div className="text-sm" style={{ fontWeight: 600, marginBottom: 2 }}>{n.label}</div>
                      <div className="text-caption text-muted">{n.desc}</div>
                    </div>
                    <div
                      onClick={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                      style={{
                        width: 40, height: 22, borderRadius: 11,
                        background: notifs[n.key] ? 'var(--accent-primary)' : 'var(--grey-700)',
                        cursor: 'pointer', transition: 'background var(--transition-fast)', position: 'relative', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3, left: notifs[n.key] ? 20 : 3,
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left var(--transition-fast)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <div className="text-h3 mb-6" style={{ fontWeight: 700 }}>{t('settings_security')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
                {[
                  { label: 'Current Password', type: 'password' },
                  { label: 'New Password', type: 'password' },
                  { label: 'Confirm Password', type: 'password' },
                ].map(f => (
                  <div key={f.label}>
                    <div className="text-caption text-muted mb-1">{f.label}</div>
                    <input className="input" type={f.type} placeholder="••••••••" />
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-primary">Update Password</button>
                </div>
                <div className="divider" />
                <div className="text-sm" style={{ fontWeight: 700 }}>Session Management</div>
                <div className="text-caption text-muted">Active Sessions: 1 (Current) · Last Login: 10 mins ago · IP: 10.0.1.45</div>
                <button className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }}>Revoke All Other Sessions</button>
                <div className="divider" />
                <div className="text-sm" style={{ fontWeight: 700 }}>Two-Factor Authentication</div>
                <div className="text-caption text-muted mb-2">Enhanced security via Catalyst Authentication 2FA</div>
                <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>Enable 2FA</button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <div className="text-h3 mb-6" style={{ fontWeight: 700 }}>{t('settings_api')}</div>
              <div className="alert-banner info mb-4">
                <Key size={13} style={{ flexShrink: 0 }} />
                <div className="text-caption text-secondary">API keys are managed via Catalyst API Gateway. Contact Super Admin to provision new keys.</div>
              </div>
              {[
                { name: 'Production API Key', key: 'ciap-prod-••••••••••••••••1a2b', status: 'active', created: '01 Jan 2024' },
                { name: 'Staging API Key', key: 'ciap-stg-••••••••••••••••3c4d', status: 'active', created: '15 Feb 2024' },
              ].map(k => (
                <div key={k.name} className="card mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{k.name}</span>
                    <span className="badge badge-low"><span className="badge-dot" />{k.status}</span>
                  </div>
                  <div className="text-caption text-secondary" style={{ fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{k.key}</div>
                  <div className="text-label text-muted">Created: {k.created}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
