import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Shield, Eye, Edit2, MoreHorizontal } from 'lucide-react';
import { USERS, AUDIT_LOGS } from '../../data/mockData';

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'badge-critical',
  scrb_analyst: 'badge-info',
  district_officer: 'badge-high',
  station_officer: 'badge-medium',
  investigator: 'badge-low',
};

const Administration: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('admin_title')}</h1>
          <p className="page-subtitle">{t('admin_subtitle')}</p>
        </div>
        {activeTab === 'users' && (
          <div className="page-header-actions">
            <button className="btn btn-primary btn-sm" id="add-user-btn"><Plus size={13} /> {t('admin_add_user')}</button>
          </div>
        )}
      </div>

      <div className="tabs">
        {[
          { key: 'users', label: t('admin_users') },
          { key: 'audit', label: t('admin_audit') },
          { key: 'roles', label: t('admin_roles') },
          { key: 'districts', label: t('admin_districts') },
        ].map(tab => (
          <div key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</div>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="search-bar" style={{ maxWidth: 320 }}>
              <Search size={13} color="var(--text-muted)" />
              <input type="text" placeholder="Search users..." />
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>{t('admin_role')}</th>
                <th>District</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-full)', background: 'var(--navy-700)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', flexShrink: 0 }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm" style={{ fontWeight: 600 }}>{u.name}</div>
                        <div className="text-caption text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{t(`role_${u.role}`)}</span></td>
                  <td className="text-caption text-secondary">{u.district}</td>
                  <td><span className={`badge badge-${u.status === 'active' ? 'low' : 'neutral'}`}><span className="badge-dot" />{u.status}</span></td>
                  <td className="text-caption text-muted">{u.lastLogin}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" title="View"><Eye size={12} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit"><Edit2 size={12} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="More"><MoreHorizontal size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOGS.map(log => (
                <tr key={log.id}>
                  <td><span className="text-mono text-muted">{log.id}</span></td>
                  <td className="text-sm" style={{ fontWeight: 500 }}>{log.user}</td>
                  <td><span className="badge badge-info">{log.action}</span></td>
                  <td className="text-caption text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>{log.resource}</td>
                  <td className="text-caption text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{log.ip}</td>
                  <td className="text-caption text-muted">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
          {[
            { role: 'Super Admin', badge: 'critical', perms: ['Full system access', 'User management', 'System configuration', 'All reports', 'Delete records'] },
            { role: 'SCRB Analyst', badge: 'info', perms: ['State-wide analytics', 'Generate reports', 'View all districts', 'Export data', 'Forecasting'] },
            { role: 'District Officer', badge: 'high', perms: ['District analytics', 'Manage FIRs', 'Alerts management', 'Resource allocation', 'District reports'] },
            { role: 'Station Officer', badge: 'medium', perms: ['Station FIRs', 'Citizen reports', 'Basic analytics', 'Station alerts', 'Profile management'] },
            { role: 'Investigator', badge: 'low', perms: ['View FIRs', 'Link analysis', 'Evidence access', 'AI Copilot', 'Read-only reports'] },
          ].map(r => (
            <div key={r.role} className="card">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} />
                <div className="text-h4" style={{ fontWeight: 700 }}>{r.role}</div>
                <span className={`badge badge-${r.badge} ml-auto`}>{r.badge}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {r.perms.map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--low)', flexShrink: 0 }} />
                    <span className="text-caption text-secondary">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'districts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>District</th><th>Kannada Name</th><th>HQ Station</th><th>Stations</th><th>Officers</th><th>Status</th></tr>
            </thead>
            <tbody>
              {['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Kalaburagi', 'Ballari', 'Shivamogga'].map((d, i) => (
                <tr key={d}>
                  <td className="text-sm" style={{ fontWeight: 600 }}>{d}</td>
                  <td style={{ fontFamily: 'var(--font-kn)', fontSize: 13 }}>{['ಬೆಂಗಳೂರು ನಗರ', 'ಮೈಸೂರು', 'ಮಂಗಳೂರು', 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ', 'ಬೆಳಗಾವಿ', 'ಕಲಬುರಗಿ', 'ಬಳ್ಳಾರಿ', 'ಶಿವಮೊಗ್ಗ'][i]}</td>
                  <td className="text-caption text-secondary">Commissioner Office</td>
                  <td className="text-caption">{[87, 34, 28, 31, 36, 29, 24, 22][i]}</td>
                  <td className="text-caption">{[4200, 1100, 900, 1050, 1240, 980, 760, 680][i].toLocaleString()}</td>
                  <td><span className="badge badge-low"><span className="badge-dot" />Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Administration;
