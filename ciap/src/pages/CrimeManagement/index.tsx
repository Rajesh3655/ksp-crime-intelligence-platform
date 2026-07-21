import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Filter, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { FIR_RECORDS } from '../../data/mockData';

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low',
};
const STATUS_BADGE: Record<string, string> = {
  open: 'badge-critical', pending: 'badge-medium', closed: 'badge-low', escalated: 'badge-high',
};

const CrimeManagement: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedFIR, setSelectedFIR] = useState<typeof FIR_RECORDS[0] | null>(null);
  const PER_PAGE = 10;

  const filtered = FIR_RECORDS.filter(r => {
    const matchSearch = !search || r.firNumber.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()) || r.district.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSev = sevFilter === 'all' || r.severity === sevFilter;
    return matchSearch && matchType && matchStatus && matchSev;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const uniqueTypes = Array.from(new Set(FIR_RECORDS.map(r => r.type)));

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('crime_title')}</h1>
          <p className="page-subtitle">{t('crime_subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary btn-sm"><Download size={13} /> {t('crime_export')}</button>
          <button className="btn btn-primary btn-sm" id="new-fir-btn"><Plus size={13} /> {t('crime_new_fir')}</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-4 mb-6">
        {[
          { label: 'Total FIRs', value: FIR_RECORDS.length, cls: '' },
          { label: 'Open', value: FIR_RECORDS.filter(r => r.status === 'open').length, cls: 'critical' },
          { label: 'Pending', value: FIR_RECORDS.filter(r => r.status === 'pending').length, cls: 'medium' },
          { label: 'Closed', value: FIR_RECORDS.filter(r => r.status === 'closed').length, cls: 'low' },
        ].map(s => (
          <div key={s.label} className={`kpi-card ${s.cls}`}>
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 wrap">
        <div className="search-bar flex-1" style={{ minWidth: 220, maxWidth: 360 }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={t('crime_search') + '...'}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            id="crime-search"
          />
        </div>
        <select className="select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="all">All Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
          <option value="escalated">Escalated</option>
        </select>
        <select className="select" value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(1); }}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="text-caption text-muted ml-auto">{filtered.length} {t('common_results')}</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('crime_fir_number')}</th>
                <th>{t('crime_date')}</th>
                <th>{t('crime_category')}</th>
                <th>{t('crime_district')}</th>
                <th>{t('crime_severity')}</th>
                <th>{t('crime_status')}</th>
                <th>{t('crime_assigned')}</th>
                <th style={{ width: 50 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedFIR(r)}>
                  <td>
                    <div className="text-sm" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.firNumber}</div>
                    <div className="text-caption text-muted">{r.id}</div>
                  </td>
                  <td className="text-caption text-secondary">{r.date}</td>
                  <td>
                    <span className="text-sm">{r.type}</span>
                  </td>
                  <td className="text-caption">{r.district}</td>
                  <td><span className={`badge ${SEVERITY_BADGE[r.severity]}`}>{r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
                  <td className="text-caption text-secondary">{r.assignedTo}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); setSelectedFIR(r); }}>
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between" style={{ padding: 'var(--space-3) var(--space-5)', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-caption text-muted">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} {t('common_of')} {filtered.length} {t('common_results')}
          </span>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={13} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn ${page === p ? 'btn-primary' : 'btn-ghost'} btn-icon btn-sm`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {/* FIR Detail Modal */}
      {selectedFIR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,11,20,0.8)', zIndex: 'var(--z-modal)' as any, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedFIR(null)}>
          <div className="card" style={{ width: 540, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-h3" style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{selectedFIR.firNumber}</div>
                <div className="text-caption text-muted">{selectedFIR.id}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedFIR(null)}>✕</button>
            </div>

            <div className="flex gap-2 mb-4">
              <span className={`badge ${SEVERITY_BADGE[selectedFIR.severity]}`}>{selectedFIR.severity}</span>
              <span className={`badge ${STATUS_BADGE[selectedFIR.status]}`}>{selectedFIR.status}</span>
            </div>

            {[
              { label: 'Crime Type', value: selectedFIR.type },
              { label: 'Date', value: selectedFIR.date },
              { label: 'District', value: selectedFIR.district },
              { label: 'Station', value: selectedFIR.station },
              { label: 'Assigned To', value: selectedFIR.assignedTo },
              { label: 'Victim', value: selectedFIR.victim },
            ].map(f => (
              <div key={f.label} className="flex" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', gap: 12 }}>
                <span className="text-caption text-muted" style={{ width: 120, flexShrink: 0 }}>{f.label}</span>
                <span className="text-caption" style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}

            <div style={{ padding: '12px 0' }}>
              <div className="text-caption text-muted mb-2">Description</div>
              <div className="text-sm text-secondary">{selectedFIR.description}</div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="btn btn-secondary flex-1">Edit FIR</button>
              <button className="btn btn-primary flex-1">Open in Link Analysis</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrimeManagement;
