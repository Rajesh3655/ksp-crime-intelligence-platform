import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, BarChart3, Brain, Calendar, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { GENERATED_REPORTS, DISTRICTS } from '../../data/mockData';

const SCRBReports: React.FC = () => {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState<string | null>(null);
  const [reportType, setReportType] = useState('monthly');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [period, setPeriod] = useState('2024-06');

  const handleGenerate = () => {
    const id = `RPT-${Date.now()}`;
    setGenerating(id);
    setTimeout(() => setGenerating(null), 3000);
  };

  const REPORT_TYPES = [
    { id: 'monthly', label: t('reports_monthly'), icon: '📅', desc: 'Monthly crime statistics and analysis' },
    { id: 'quarterly', label: t('reports_quarterly'), icon: '📊', desc: 'Quarterly trend analysis and intelligence brief' },
    { id: 'scrb', label: t('reports_scrb'), icon: '📋', desc: 'SCRB standardized statistical report' },
    { id: 'briefing', label: t('reports_briefing'), icon: '🧠', desc: 'Executive intelligence briefing document' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('reports_title')}</h1>
          <p className="page-subtitle">{t('reports_subtitle')}</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr', gap: 'var(--space-4)' }}>
        {/* Generate Report Panel */}
        <div className="card">
          <div className="card-header mb-4">
            <div className="flex items-center gap-2">
              <Brain size={14} color="var(--accent-primary)" />
              <div className="card-title">{t('reports_generate')}</div>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="text-label text-muted mb-2">Report Type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {REPORT_TYPES.map(rt => (
              <div
                key={rt.id}
                onClick={() => setReportType(rt.id)}
                className="flex items-center gap-3"
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${reportType === rt.id ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                  background: reportType === rt.id ? 'var(--bg-selected)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 6, background: reportType === rt.id ? 'var(--info-bg)' : 'var(--navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {rt.icon}
                </div>
                <div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>{rt.label}</div>
                  <div className="text-caption text-muted">{rt.desc}</div>
                </div>
                {reportType === rt.id && <CheckCircle size={14} color="var(--accent-primary)" style={{ marginLeft: 'auto' }} />}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="text-label text-muted mb-2">District</div>
          <select className="select w-full mb-3" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            <option value="all">All Districts</option>
            {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="text-label text-muted mb-2">Period</div>
          <input type="month" className="input mb-4" value={period} onChange={e => setPeriod(e.target.value)} />

          <button
            className="btn btn-primary w-full"
            onClick={handleGenerate}
            disabled={!!generating}
            id="generate-report-btn"
          >
            {generating ? (
              <><RefreshCw size={13} className="spin" /> Generating Report...</>
            ) : (
              <><FileText size={13} /> {t('reports_generate')}</>
            )}
          </button>

          {generating && (
            <div className="alert-banner info mt-4" style={{ padding: '10px 12px' }}>
              <Clock size={13} style={{ flexShrink: 0 }} />
              <div className="text-caption text-secondary">
                Report generation in progress via Catalyst SmartBrowz. This may take 30–60 seconds.
              </div>
            </div>
          )}
        </div>

        {/* Generated Reports List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="card-title">{t('reports_generated')}</div>
          </div>
          <div style={{ overflowY: 'auto' }}>
            {GENERATED_REPORTS.map(report => (
              <div
                key={report.id}
                className="flex items-center gap-4"
                style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--navy-800)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {report.type === 'monthly' ? '📅' : report.type === 'quarterly' ? '📊' : report.type === 'scrb' ? '📋' : '🧠'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm truncate" style={{ fontWeight: 600, marginBottom: 2 }}>{report.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-neutral">{report.type.toUpperCase()}</span>
                    <span className="text-caption text-muted">{report.district}</span>
                    <span className="text-caption text-muted">{report.createdAt}</span>
                    {report.size !== '—' && <span className="text-label text-muted">{report.size}</span>}
                  </div>
                </div>

                {/* Status / Actions */}
                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                  {report.status === 'generating' ? (
                    <span className="badge badge-medium">
                      <span className="badge-dot" />
                      Generating
                    </span>
                  ) : (
                    <>
                      <button className="btn btn-secondary btn-sm" id={`download-pdf-${report.id}`}>
                        <Download size={12} /> {t('reports_download_pdf')}
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <BarChart3 size={12} /> Excel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SCRBReports;
