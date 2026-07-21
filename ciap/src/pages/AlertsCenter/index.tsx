import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, Bell, CheckCircle, ArrowUp, Clock, User, MapPin,
  Filter, RefreshCw, Zap, Shield, Eye,
} from 'lucide-react';
import { ALERTS } from '../../data/mockData';

type AlertStatus = 'active' | 'acknowledged' | 'resolved';

const AlertsCenter: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState(ALERTS);
  const [filter, setFilter] = useState<'all' | AlertStatus>('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = alerts.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

  const counts = {
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: 12, // mock resolved today
  };

  const acknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' as const } : a));
  };

  const escalate = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'active' as const, severity: 'critical' as const } : a));
  };

  const SEV_ICON: Record<string, React.ReactNode> = {
    critical: <Zap size={15} color="var(--critical-light)" />,
    high: <AlertTriangle size={15} color="var(--high-light)" />,
    medium: <Bell size={15} color="var(--medium-light)" />,
    low: <Shield size={15} color="var(--low-light)" />,
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('alerts_title')}</h1>
          <p className="page-subtitle">{t('alerts_subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <div className="flex items-center gap-2">
            <span className="live-dot critical" />
            <span className="text-caption" style={{ color: 'var(--critical-light)', fontWeight: 600 }}>{counts.active} Active</span>
          </div>
          <button className="btn btn-ghost btn-sm"><RefreshCw size={13} /> {t('common_refresh')}</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-4 mb-6">
        <div className="kpi-card critical">
          <div className="kpi-label">{t('alerts_active')}</div>
          <div className="kpi-value">{counts.active}</div>
          <div className="text-caption text-muted">require attention</div>
        </div>
        <div className="kpi-card high">
          <div className="kpi-label">{t('sev_critical')} Alerts</div>
          <div className="kpi-value">{counts.critical}</div>
          <div className="text-caption text-muted">immediate action</div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-label">{t('alerts_acknowledged')}</div>
          <div className="kpi-value">{counts.acknowledged}</div>
          <div className="text-caption text-muted">in progress</div>
        </div>
        <div className="kpi-card low">
          <div className="kpi-label">{t('alerts_resolved')}</div>
          <div className="kpi-value">{counts.resolved}</div>
          <div className="text-caption text-muted">resolved today</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={13} color="var(--text-muted)" />
          <span className="text-caption text-muted">{t('alerts_filters')}:</span>
        </div>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {(['all', 'active', 'acknowledged', 'resolved'] as const).map(f => (
            <div key={f} className={`tab ${filter === f ? 'active' : ''}`} style={{ padding: '6px 14px' }}
              onClick={() => setFilter(f)} id={`filter-${f}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'active' && counts.active > 0 && (
                <span className="nav-badge" style={{ marginLeft: 6 }}>{counts.active}</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <select className="select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">{t('sev_critical')}</option>
            <option value="high">{t('sev_high')}</option>
            <option value="medium">{t('sev_medium')}</option>
            <option value="low">{t('sev_low')}</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(alert => (
          <div
            key={alert.id}
            className={`alert-banner ${alert.severity}`}
            style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', flexDirection: 'row', alignItems: 'flex-start' }}
            id={`alert-${alert.id}`}
          >
            {/* Icon */}
            <div style={{ marginTop: 2, flexShrink: 0 }}>{SEV_ICON[alert.severity]}</div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center gap-2 mb-1 wrap">
                <span className="text-sm" style={{ fontWeight: 700 }}>{alert.type}</span>
                <span className={`badge badge-${alert.severity}`}>{alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}</span>
                <span className={`badge badge-${alert.status === 'active' ? 'critical' : alert.status === 'acknowledged' ? 'info' : 'low'}`}>
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </span>
                <span className="badge badge-neutral">{alert.id}</span>
              </div>
              <div className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{alert.message}</div>
              <div className="flex items-center gap-4 wrap">
                <div className="flex items-center gap-1 text-muted">
                  <MapPin size={11} />
                  <span className="text-caption">{alert.district}</span>
                </div>
                <div className="flex items-center gap-1 text-muted">
                  <Clock size={11} />
                  <span className="text-caption">{alert.time}</span>
                </div>
                {alert.assignee && (
                  <div className="flex items-center gap-1 text-muted">
                    <User size={11} />
                    <span className="text-caption">{alert.assignee}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2" style={{ flexShrink: 0, marginLeft: 12 }}>
              <button className="btn btn-ghost btn-icon btn-sm" title="View details" aria-label="View alert details">
                <Eye size={13} />
              </button>
              {alert.status === 'active' && (
                <>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => acknowledge(alert.id)}
                    id={`ack-${alert.id}`}
                    aria-label={`Acknowledge alert ${alert.id}`}
                  >
                    <CheckCircle size={12} /> {t('alerts_acknowledge')}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => escalate(alert.id)}
                    id={`esc-${alert.id}`}
                    aria-label={`Escalate alert ${alert.id}`}
                  >
                    <ArrowUp size={12} /> {t('alerts_escalate')}
                  </button>
                </>
              )}
              {alert.status === 'acknowledged' && (
                <button className="btn btn-primary btn-sm">
                  {t('alerts_assign')}
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state">
            <CheckCircle size={40} className="empty-icon" />
            <div className="empty-title">No alerts match your filters</div>
            <div className="empty-description">Try adjusting the severity or status filter above</div>
          </div>
        )}
      </div>

      {/* Alert History Header */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <div className="text-h3" style={{ fontWeight: 600 }}>{t('alerts_history')}</div>
        <button className="btn btn-ghost btn-sm">{t('common_export')} →</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Type</th>
              <th>District</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Time</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {ALERTS.map(a => (
              <tr key={a.id}>
                <td><span className="text-mono text-muted">{a.id}</span></td>
                <td><span className="text-sm" style={{ fontWeight: 500 }}>{a.type}</span></td>
                <td className="text-caption text-secondary">{a.district}</td>
                <td><span className={`badge badge-${a.severity}`}>{a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}</span></td>
                <td><span className={`badge badge-${a.status === 'active' ? 'critical' : a.status === 'acknowledged' ? 'info' : 'low'}`}>{a.status}</span></td>
                <td className="text-caption text-muted">{a.time}</td>
                <td className="text-caption">{a.assignee || <span className="text-muted">Unassigned</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsCenter;
