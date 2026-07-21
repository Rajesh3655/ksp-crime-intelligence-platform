import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  AlertTriangle, TrendingUp, TrendingDown, Minus,
  Users, Shield, Activity, Clock, MapPin, ChevronRight,
  Zap, Target, Radio,
} from 'lucide-react';
import {
  STATE_KPIs, CRIME_TREND_30, DISTRICTS, RECENT_INCIDENTS,
  ALERTS, CRIME_DISTRIBUTION, RESOURCES,
} from '../../data/mockData';

const SeverityBadge: React.FC<{ sev: string }> = ({ sev }) => (
  <span className={`badge badge-${sev}`}>
    <span className="badge-dot" />
    {sev.charAt(0).toUpperCase() + sev.slice(1)}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = { open: 'critical', pending: 'medium', closed: 'low', escalated: 'high', active: 'critical', resolved: 'low', acknowledged: 'info' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

const KPICard: React.FC<{
  label: string; value: string | number; delta?: number;
  icon: React.ReactNode; severity?: string; unit?: string;
}> = ({ label, value, delta, icon, severity, unit }) => (
  <div className={`kpi-card ${severity || ''}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}{unit && <span style={{ fontSize: '1rem', marginLeft: 4, color: 'var(--text-secondary)' }}>{unit}</span>}</div>
    {delta !== undefined && (
      <div className={`kpi-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>
        {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
        <span>{Math.abs(delta)} from yesterday</span>
      </div>
    )}
  </div>
);

const customTooltipStyle = {
  background: 'var(--navy-800)',
  border: '1px solid var(--border-default)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 12,
  color: 'var(--text-primary)',
};

const CommandCenter: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('30d');

  const kpi = STATE_KPIs;
  const criticalAlerts = ALERTS.filter(a => a.severity === 'critical' && a.status === 'active');
  const topDistricts = [...DISTRICTS].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('dash_title')}</h1>
          <p className="page-subtitle">{t('dash_subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-caption text-muted">{t('common_live')} · Updated 2 mins ago</span>
          </div>
          <select className="select" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="7d">{t('common_last_7')}</option>
            <option value="30d">{t('common_last_30')}</option>
            <option value="today">{t('common_today')}</option>
          </select>
          <button className="btn btn-secondary btn-sm">
            <Activity size={13} /> {t('common_refresh')}
          </button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="alert-banner critical mb-6" role="alert">
          <div style={{ flexShrink: 0, marginTop: 2 }}><Zap size={16} color="var(--critical-light)" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--critical-light)', marginBottom: 4 }}>
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Immediate Action
            </div>
            {criticalAlerts.map(a => (
              <div key={a.id} className="text-caption text-secondary" style={{ marginBottom: 2 }}>
                • <strong>{a.district}</strong>: {a.message}
              </div>
            ))}
          </div>
          <button className="btn btn-danger btn-sm">
            <ChevronRight size={13} /> View Alerts
          </button>
        </div>
      )}

      {/* KPI Row 1 */}
      <div className="grid grid-4 mb-6" style={{ gap: 'var(--space-4)' }}>
        <KPICard label={t('dash_incidents_today')} value={kpi.incidentsToday} delta={kpi.incidentsDelta} icon={<Activity size={40} />} severity="critical" />
        <KPICard label={t('dash_open_firs')} value={kpi.openFIRs.toLocaleString()} delta={kpi.openFIRsDelta} icon={<Shield size={40} />} />
        <KPICard label={t('dash_active_alerts')} value={kpi.activeAlerts} delta={kpi.alertsDelta} icon={<AlertTriangle size={40} />} severity="high" />
        <KPICard label={t('dash_arrests_today')} value={kpi.arrestsToday} delta={kpi.arrestsDelta} icon={<Users size={40} />} severity="low" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-4 mb-6" style={{ gap: 'var(--space-4)' }}>
        <KPICard label={t('dash_risk_score')} value={kpi.stateRiskScore} delta={kpi.riskDelta} icon={<Target size={40} />} severity="high" unit="/100" />
        <KPICard label={t('dash_hotspot_districts')} value={kpi.hotspotDistricts} icon={<MapPin size={40} />} severity="medium" />
        <KPICard label={t('dash_resources_deployed')} value={kpi.resourcesDeployed.toLocaleString()} delta={kpi.resourcesDelta} icon={<Radio size={40} />} severity="low" />
        <KPICard label="Closure Rate" value={`${kpi.closureRate}%`} icon={<TrendingUp size={40} />} severity="low" />
      </div>

      {/* Main Content Grid */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
        {/* Crime Trend Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">{t('dash_crime_trend')}</div>
            <div className="flex items-center gap-2">
              <span className="badge badge-info"><span className="badge-dot" />Total: {kpi.incidentsToday * 30}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CRIME_TREND_30} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTheft" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRobbery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCyber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              <Area type="monotone" dataKey="theft" stroke="#3B82F6" fill="url(#gradTheft)" strokeWidth={1.5} name="Theft" dot={false} />
              <Area type="monotone" dataKey="cybercrime" stroke="#6366F1" fill="url(#gradCyber)" strokeWidth={1.5} name="Cybercrime" dot={false} />
              <Area type="monotone" dataKey="assault" stroke="#EA580C" fill="none" strokeWidth={1.5} name="Assault" dot={false} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="robbery" stroke="#DC2626" fill="url(#gradRobbery)" strokeWidth={1.5} name="Robbery" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Crime Distribution Pie */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Crime Distribution</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={CRIME_DISTRIBUTION} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                {CRIME_DISTRIBUTION.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CRIME_DISTRIBUTION.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span className="text-caption text-secondary flex-1">{d.name}</span>
                <span className="text-label text-muted">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District Risk + Live Feed */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        {/* District Risk Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="card-title">{t('dash_hotspot_table')}</div>
            <button className="btn btn-ghost btn-sm text-caption">View All →</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            {topDistricts.map((d, i) => (
              <div
                key={d.id}
                className="flex items-center gap-3"
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
                onClick={() => setSelectedDistrict(d.name)}
              >
                <span className="text-muted text-caption" style={{ width: 18, textAlign: 'right' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ fontWeight: 500 }}>{d.name}</div>
                  <div className="text-caption text-muted">{d.incidents.toLocaleString()} incidents MTD</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`badge badge-${d.riskScore >= 65 ? 'critical' : d.riskScore >= 50 ? 'high' : d.riskScore >= 40 ? 'medium' : 'low'}`}>
                    {d.riskScore}
                  </span>
                  <div className="progress-bar" style={{ width: 80 }}>
                    <div
                      className={`progress-fill ${d.riskScore >= 65 ? 'critical' : d.riskScore >= 50 ? 'high' : d.riskScore >= 40 ? 'medium' : 'low'}`}
                      style={{ width: `${d.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Incident Feed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="live-dot critical" />
              <div className="card-title">{t('dash_live_feed')}</div>
            </div>
            <button className="btn btn-ghost btn-sm text-caption">View All →</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            {RECENT_INCIDENTS.map(inc => (
              <div
                key={inc.id}
                className="flex items-start gap-3"
                style={{ padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div className={`status-dot ${inc.severity}`} style={{ marginTop: 5, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{inc.type}</span>
                    <SeverityBadge sev={inc.severity} />
                  </div>
                  <div className="text-caption text-secondary truncate">{inc.district} · {inc.station}</div>
                  <div className="text-caption text-muted">{inc.fir}</div>
                </div>
                <div className="flex flex-col items-end gap-1" style={{ flexShrink: 0 }}>
                  <StatusBadge status={inc.status} />
                  <div className="flex items-center gap-1 text-muted">
                    <Clock size={10} />
                    <span className="text-label">{inc.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Allocation */}
      <div className="card mt-4">
        <div className="card-header mb-4">
          <div className="card-title">{t('dash_resource_allocation')}</div>
          <button className="btn btn-ghost btn-sm">Manage →</button>
        </div>
        <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
          {RESOURCES.map(r => (
            <div key={r.district} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ fontWeight: 500 }}>{r.district}</span>
                <span className={`badge badge-${r.utilization >= 90 ? 'critical' : r.utilization >= 75 ? 'high' : 'medium'}`}>
                  {r.utilization}%
                </span>
              </div>
              <div className="text-caption text-muted">
                {r.deployed.toLocaleString()} / {r.personnel.toLocaleString()} personnel · {r.vehicles} vehicles
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${r.utilization >= 90 ? 'critical' : r.utilization >= 75 ? 'high' : 'medium'}`}
                  style={{ width: `${r.utilization}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
