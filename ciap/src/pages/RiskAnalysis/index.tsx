import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { RISK_SCORES } from '../../data/mockData';

const TOOLTIP_STYLE = { background: 'var(--navy-800)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)' };

const RiskAnalysis: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDistrict, setSelectedDistrict] = useState(RISK_SCORES[0]);

  const radarData = [
    { subject: 'Crime Rate', value: selectedDistrict.factors.crimeRate },
    { subject: 'Recidivism', value: selectedDistrict.factors.recidivism },
    { subject: 'Socioeconomic', value: selectedDistrict.factors.socioeconomic },
    { subject: 'Infrastructure', value: selectedDistrict.factors.infrastructure },
    { subject: 'Overall', value: selectedDistrict.riskScore },
  ];

  const barData = RISK_SCORES.map(d => ({
    name: d.name.replace('Hubballi-Dharwad', 'Hubballi').replace(' Urban', ''),
    score: d.riskScore,
    fill: d.riskScore >= 65 ? '#DC2626' : d.riskScore >= 50 ? '#EA580C' : d.riskScore >= 40 ? '#D97706' : '#16A34A',
  }));

  const getRisk = (s: number) => s >= 65 ? 'critical' : s >= 50 ? 'high' : s >= 40 ? 'medium' : 'low';

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('risk_title')}</h1>
          <p className="page-subtitle">{t('risk_subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <select className="select" onChange={e => { const d = RISK_SCORES.find(r => r.id === e.target.value); if (d) setSelectedDistrict(d); }}>
            {RISK_SCORES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm"><Filter size={13} /> {t('common_filter')}</button>
        </div>
      </div>

      {/* State Risk KPIs */}
      <div className="grid grid-4 mb-6">
        {[
          { label: 'Critical Districts', value: RISK_SCORES.filter(d => d.riskScore >= 65).length, cls: 'critical' },
          { label: 'High Risk Districts', value: RISK_SCORES.filter(d => d.riskScore >= 50 && d.riskScore < 65).length, cls: 'high' },
          { label: 'Medium Risk', value: RISK_SCORES.filter(d => d.riskScore >= 40 && d.riskScore < 50).length, cls: 'medium' },
          { label: 'Low Risk', value: RISK_SCORES.filter(d => d.riskScore < 40).length, cls: 'low' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.cls}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="text-caption text-muted">districts</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {/* District Bar Chart */}
        <div className="card">
          <div className="card-header mb-4">
            <div className="card-title">All Districts — Risk Scores</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-40} textAnchor="end" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="score" name="Risk Score" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart for selected district */}
        <div className="card">
          <div className="card-header mb-0">
            <div className="card-title">{t('risk_factors')} — {selectedDistrict.name}</div>
            <span className={`badge badge-${getRisk(selectedDistrict.riskScore)}`}>{selectedDistrict.riskScore}/100</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Radar name="Risk" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High Risk Stations Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="card-title">{t('risk_high_risk_stations')}</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Risk Score</th>
              <th>Trend</th>
              <th>Crime Rate</th>
              <th>Recidivism</th>
              <th>Socioeconomic</th>
              <th>Last Computed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {RISK_SCORES.sort((a, b) => b.riskScore - a.riskScore).map(d => (
              <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDistrict(d)}>
                <td><span className="text-sm" style={{ fontWeight: 600 }}>{d.name}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${getRisk(d.riskScore)}`}>{d.riskScore}</span>
                    <div className="progress-bar" style={{ width: 60 }}>
                      <div className={`progress-fill ${getRisk(d.riskScore)}`} style={{ width: `${d.riskScore}%` }} />
                    </div>
                  </div>
                </td>
                <td>
                  {d.trend === 'up' ? <TrendingUp size={14} color="var(--critical-light)" /> :
                    d.trend === 'down' ? <TrendingDown size={14} color="var(--low-light)" /> :
                      <Minus size={14} color="var(--text-muted)" />}
                </td>
                <td className="text-caption text-secondary">{d.factors.crimeRate}</td>
                <td className="text-caption text-secondary">{d.factors.recidivism}</td>
                <td className="text-caption text-secondary">{d.factors.socioeconomic}</td>
                <td className="text-caption text-muted">{d.lastComputed}</td>
                <td><button className="btn btn-ghost btn-sm">Details →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskAnalysis;
