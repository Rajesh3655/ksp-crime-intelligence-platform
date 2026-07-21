import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, MapPin, Clock, User, Filter, Eye } from 'lucide-react';
import { CITIZEN_REPORTS } from '../../data/mockData';

const CitizenReports: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState(CITIZEN_REPORTS);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const verify = (id: string) => setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'verified' as const } : r));
  const reject = (id: string) => setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r));

  const counts = {
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.status === 'verified').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('citizen_title')}</h1>
          <p className="page-subtitle">{t('citizen_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-3 mb-6">
        <div className="kpi-card medium"><div className="kpi-label">{t('citizen_pending')}</div><div className="kpi-value">{counts.pending}</div></div>
        <div className="kpi-card low"><div className="kpi-label">{t('citizen_verified')}</div><div className="kpi-value">{counts.verified}</div></div>
        <div className="kpi-card"><div className="kpi-label">{t('citizen_rejected')}</div><div className="kpi-value">{counts.rejected}</div></div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {['all', 'pending', 'verified', 'rejected'].map(f => (
          <div key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && counts.pending > 0 && <span className="nav-badge" style={{ marginLeft: 6 }}>{counts.pending}</span>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(report => (
          <div key={report.id} className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="flex items-start gap-4">
              <div style={{
                width: 42, height: 42, borderRadius: 'var(--radius-md)',
                background: report.status === 'pending' ? 'var(--medium-bg)' : report.status === 'verified' ? 'var(--low-bg)' : 'var(--grey-800)',
                border: `1px solid ${report.status === 'pending' ? 'var(--medium-border)' : report.status === 'verified' ? 'var(--low-border)' : 'var(--grey-700)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 20 }}>{report.status === 'pending' ? '📋' : report.status === 'verified' ? '✅' : '❌'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1 wrap">
                  <span className="text-sm" style={{ fontWeight: 700 }}>{report.id}</span>
                  <span className="badge badge-info">{report.category}</span>
                  <span className={`badge badge-${report.status === 'pending' ? 'medium' : report.status === 'verified' ? 'low' : 'neutral'}`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm mb-2">{report.description}</div>
                <div className="flex items-center gap-4 wrap">
                  <div className="flex items-center gap-1 text-muted"><MapPin size={11} /><span className="text-caption">{report.location}</span></div>
                  <div className="flex items-center gap-1 text-muted"><Clock size={11} /><span className="text-caption">{report.time}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                <button className="btn btn-ghost btn-icon btn-sm"><Eye size={13} /></button>
                {report.status === 'pending' && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => verify(report.id)}>
                      <CheckCircle size={12} /> {t('citizen_verify')}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => reject(report.id)}>
                      <XCircle size={12} /> {t('citizen_reject')}
                    </button>
                  </>
                )}
                {report.status === 'verified' && (
                  <button className="btn btn-primary btn-sm"><User size={12} /> {t('citizen_assign')}</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitizenReports;
