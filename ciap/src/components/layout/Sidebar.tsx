import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Siren, MapPin, TrendingUp, AlertTriangle,
  Network, Bell, Bot, FileText, BarChart3, Settings, Users,
  Shield, ChevronLeft, ChevronRight, ClipboardList, Map,
} from 'lucide-react';

interface NavItemDef {
  to: string;
  icon: React.ReactNode;
  labelKey: string;
  badge?: number;
  section: string;
}

const NAV_ITEMS: NavItemDef[] = [
  // Core
  { to: '/', icon: <LayoutDashboard size={18} />, labelKey: 'nav_dashboard', section: 'core' },
  { to: '/command-center', icon: <Siren size={18} />, labelKey: 'nav_command_center', section: 'core' },
  { to: '/crimes', icon: <ClipboardList size={18} />, labelKey: 'nav_crime_management', section: 'core' },
  // Intelligence
  { to: '/heatmap', icon: <Map size={18} />, labelKey: 'nav_geo_heatmap', section: 'intelligence' },
  { to: '/forecasting', icon: <TrendingUp size={18} />, labelKey: 'nav_forecasting', section: 'intelligence' },
  { to: '/risk', icon: <AlertTriangle size={18} />, labelKey: 'nav_risk_analysis', section: 'intelligence' },
  { to: '/link-analysis', icon: <Network size={18} />, labelKey: 'nav_link_analysis', section: 'intelligence' },
  // Operations
  { to: '/alerts', icon: <Bell size={18} />, labelKey: 'nav_alerts_center', badge: 7, section: 'operations' },
  { to: '/ai-copilot', icon: <Bot size={18} />, labelKey: 'nav_ai_copilot', section: 'operations' },
  { to: '/citizen-reports', icon: <MapPin size={18} />, labelKey: 'nav_citizen_reports', badge: 3, section: 'operations' },
  { to: '/scrb-reports', icon: <BarChart3 size={18} />, labelKey: 'nav_scrb_reports', section: 'operations' },
  // System
  { to: '/administration', icon: <Users size={18} />, labelKey: 'nav_administration', section: 'system' },
  { to: '/settings', icon: <Settings size={18} />, labelKey: 'nav_settings', section: 'system' },
];

const SECTIONS: { key: string; labelKey: string }[] = [
  { key: 'core', labelKey: 'section_core' },
  { key: 'intelligence', labelKey: 'section_intelligence' },
  { key: 'operations', labelKey: 'section_operations' },
  { key: 'system', labelKey: 'section_system' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { t } = useTranslation();

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Main Navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={18} />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-title">{t('platform_name')}</div>
          <div className="sidebar-logo-subtitle">{t('platform_org')}</div>
        </div>
      </div>

      {/* Navigation Items grouped by section */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px' }}>
        {SECTIONS.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section.key);
          return (
            <div className="sidebar-section" key={section.key}>
              <div className="sidebar-section-title">{t(section.labelKey)}</div>
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-item-label">{t(item.labelKey)}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <button
        className="btn btn-ghost btn-icon"
        style={{
          position: 'absolute', bottom: '16px',
          left: collapsed ? '12px' : '12px',
          width: 32, height: 32,
          border: '1px solid var(--border-subtle)',
          background: 'var(--navy-800)',
        }}
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </nav>
  );
};

export default Sidebar;
