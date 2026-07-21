import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, RefreshCw, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ALERTS } from '../../data/mockData';

interface TopbarProps {
  onNotifClick?: () => void;
}

const PAGE_TITLES: Record<string, { en: string; kn: string }> = {
  '/': { en: 'Dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  '/command-center': { en: 'Command Center', kn: 'ಕಮಾಂಡ್ ಸೆಂಟರ್' },
  '/crimes': { en: 'Crime Management', kn: 'ಅಪರಾಧ ನಿರ್ವಹಣೆ' },
  '/heatmap': { en: 'Geo Heatmap', kn: 'ಭೂ ಉಷ್ಣ ನಕ್ಷೆ' },
  '/forecasting': { en: 'Forecasting', kn: 'ಮುನ್ಸೂಚನೆ' },
  '/risk': { en: 'Risk Analysis', kn: 'ಅಪಾಯ ವಿಶ್ಲೇಷಣೆ' },
  '/link-analysis': { en: 'Link Analysis', kn: 'ಲಿಂಕ್ ವಿಶ್ಲೇಷಣೆ' },
  '/alerts': { en: 'Alerts Center', kn: 'ಎಚ್ಚರಿಕೆ ಕೇಂದ್ರ' },
  '/ai-copilot': { en: 'AI Copilot', kn: 'ಎಐ ಸಹಾಯಕ' },
  '/citizen-reports': { en: 'Citizen Reports', kn: 'ನಾಗರಿಕ ವರದಿಗಳು' },
  '/scrb-reports': { en: 'SCRB Reports', kn: 'ಎಸ್‌ಸಿಆರ್‌ಬಿ ವರದಿಗಳು' },
  '/administration': { en: 'Administration', kn: 'ಆಡಳಿತ' },
  '/settings': { en: 'Settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
};

const Topbar: React.FC<TopbarProps> = ({ onNotifClick }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [lastRefresh, setLastRefresh] = useState('Just now');

  const criticalCount = ALERTS.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const lang = i18n.language;

  const pageTitleDef = PAGE_TITLES[location.pathname] || { en: 'CIAP', kn: 'ಸಿಐಎಪಿ' };
  const pageTitle = lang === 'kn' ? pageTitleDef.kn : pageTitleDef.en;

  const switchLang = (l: string) => {
    i18n.changeLanguage(l);
    document.body.className = l === 'kn' ? 'lang-kn' : '';
  };

  const handleRefresh = () => {
    setLastRefresh('Just now');
  };

  return (
    <header className="topbar" role="banner">
      {/* Breadcrumb / Title */}
      <div className="flex flex-col" style={{ gap: 2 }}>
        <div className="topbar-breadcrumb">
          <span>{t('platform_name')}</span>
          <ChevronRight size={12} />
          <span className="active">{pageTitle}</span>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Live indicator */}
      <div className="flex items-center gap-2" style={{ marginRight: 8 }}>
        <span className="live-dot" />
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', fontWeight: 600 }}>
          {t('common_live')}
        </span>
      </div>

      {/* Global Search */}
      <div className="search-bar" style={{ minWidth: 220 }}>
        <Search size={14} color="var(--text-muted)" />
        <input
          type="search"
          placeholder={t('common_search') + ' FIR, Incidents, Persons...'}
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          aria-label="Global search"
          id="global-search"
        />
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: 3 }}>⌘K</span>
      </div>

      {/* Refresh */}
      <button className="btn btn-ghost btn-icon btn-sm" onClick={handleRefresh} title="Refresh data" aria-label="Refresh">
        <RefreshCw size={15} />
      </button>

      {/* Notifications */}
      <div className="notif-btn">
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onNotifClick}
          aria-label={`${criticalCount} active alerts`}
          id="notification-btn"
        >
          <Bell size={16} />
        </button>
        {criticalCount > 0 && <span className="notif-count">{criticalCount}</span>}
      </div>

      {/* Divider */}
      <div className="divider-v" style={{ height: 20 }} />

      {/* Language Toggle */}
      <div className="lang-toggle" role="group" aria-label="Language selector">
        <button
          className={`lang-btn ${lang !== 'kn' ? 'active' : ''}`}
          onClick={() => switchLang('en')}
          aria-pressed={lang !== 'kn'}
          id="lang-en"
        >
          EN
        </button>
        <div className="lang-divider-v" />
        <button
          className={`lang-btn ${lang === 'kn' ? 'active' : ''}`}
          onClick={() => switchLang('kn')}
          aria-pressed={lang === 'kn'}
          id="lang-kn"
          style={{ fontFamily: 'var(--font-kn)' }}
        >
          ಕನ್ನಡ
        </button>
      </div>

      {/* User Avatar */}
      <div
        style={{
          width: 32, height: 32,
          background: 'var(--navy-700)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-full)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-caption)',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="Supt. Ramaiah K. — Super Admin"
        role="button"
        tabIndex={0}
        aria-label="User profile"
      >
        RK
      </div>
    </header>
  );
};

export default Topbar;
