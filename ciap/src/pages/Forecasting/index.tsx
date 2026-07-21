import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, Legend,
  BarChart, Bar,
} from 'recharts';
import { TrendingUp, RefreshCw, Info, Download, Brain, AlertTriangle } from 'lucide-react';
import { FORECAST_7DAY, FORECAST_30DAY, DISTRICTS } from '../../data/mockData';

const TOOLTIP_STYLE = {
  background: 'var(--navy-800)', border: '1px solid var(--border-default)',
  borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)',
};

const DistrictForecastBar: React.FC = () => {
  const data = DISTRICTS.slice(0, 8).map(d => ({
    name: d.name.replace('Hubballi-Dharwad', 'Hubballi').replace(' Urban', ''),
    predicted: Math.floor(d.incidents * 0.08 + Math.random() * 20),
    confidence: Math.floor(75 + Math.random() * 20),
    risk: d.riskScore,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-35} textAnchor="end" tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="predicted" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Predicted Incidents" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const Forecasting: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [crimeFilter, setCrimeFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  const data = period === '7d' ? FORECAST_7DAY : FORECAST_30DAY;
  const avgPredicted = Math.round(data.reduce((a, b) => a + b.predicted, 0) / data.length);
  const avgConfidence = Math.round(data.reduce((a, b) => a + b.confidence, 0) / data.length);
  const peakDay = data.reduce((a, b) => (b.predicted > a.predicted ? b : a));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2200);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('forecast_title')}</h1>
          <p className="page-subtitle">{t('forecast_subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <select className="select" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            <option value="all">{t('common_all')} Districts</option>
            {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="select" value={crimeFilter} onChange={e => setCrimeFilter(e.target.value)}>
            <option value="all">{t('common_all')} Crime Types</option>
            <option value="theft">{t('crime_theft')}</option>
            <option value="assault">{t('crime_assault')}</option>
            <option value="robbery">{t('crime_robbery')}</option>
          </select>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} id="generate-forecast-btn">
            <Brain size={14} />
            {generating ? 'Generating...' : t('forecast_generate')}
          </button>
        </div>
      </div>

      {/* Period Toggle */}
      <div className="tabs mb-0" style={{ marginBottom: 'var(--space-6)' }}>
        <div className={`tab ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')} id="tab-7day">{t('forecast_7day')}</div>
        <div className={`tab ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')} id="tab-30day">{t('forecast_30day')}</div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-label">{t('forecast_predicted')} (Daily Avg)</div>
          <div className="kpi-value" style={{ fontFamily: 'var(--font-mono)' }}>{avgPredicted}</div>
          <div className="text-caption text-muted">incidents / day</div>
        </div>
        <div className="kpi-card medium">
          <div className="kpi-label">{t('forecast_confidence')}</div>
          <div className="kpi-value">{avgConfidence}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
          <div className="progress-bar mt-2">
            <div className="progress-fill medium" style={{ width: `${avgConfidence}%` }} />
          </div>
        </div>
        <div className="kpi-card high">
          <div className="kpi-label">Peak Day</div>
          <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{peakDay.date.split(' ').slice(0, 2).join(' ')}</div>
          <div className="text-caption text-muted">{peakDay.predicted} predicted incidents</div>
        </div>
        <div className="kpi-card low">
          <div className="kpi-label">{t('forecast_model')}</div>
          <div className="kpi-value" style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>Zia AutoML</div>
          <div className="text-caption text-muted">Time-series LSTM</div>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="card mb-4">
        <div className="card-header mb-4">
          <div className="card-title">Predicted Incident Volume — {period === '7d' ? 'Next 7 Days' : 'Next 30 Days'}</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-caption text-muted">
              <div style={{ width: 20, borderTop: '2px dashed var(--accent-primary)', display: 'inline-block' }} />
              Prediction
            </div>
            <div className="flex items-center gap-2 text-caption text-muted" style={{ marginLeft: 8 }}>
              <div style={{ width: 20, height: 8, background: 'rgba(59,130,246,0.15)', display: 'inline-block', borderRadius: 2 }} />
              Confidence Band
            </div>
            <button className="btn btn-ghost btn-sm btn-icon" title="Download chart"><Download size={13} /></button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={period === '7d' ? 0 : 4} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#gradBand)" name="Upper Bound" />
            <Area type="monotone" dataKey="lower" stroke="transparent" fill="var(--navy-900)" name="Lower Bound" />
            <Area type="monotone" dataKey="predicted" stroke="#3B82F6" fill="url(#gradPred)" strokeWidth={2} name="Predicted" dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* District Forecast + Explanation */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* District Breakdown */}
        <div className="card">
          <div className="card-header mb-4">
            <div className="card-title">District-Level Forecast (Next 7 Days)</div>
          </div>
          <DistrictForecastBar />
        </div>

        {/* Forecast Explanation */}
        <div className="card">
          <div className="card-header mb-4">
            <div className="flex items-center gap-2">
              <Brain size={14} color="var(--accent-primary)" />
              <div className="card-title">{t('forecast_explanation')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { factor: 'Historical Crime Patterns', weight: 40, impact: 'high', desc: 'Weekend robbery spike pattern detected in Bengaluru and Kalaburagi' },
              { factor: 'Seasonal Index', weight: 25, impact: 'medium', desc: 'Pre-monsoon period historically shows 12% elevation in outdoor crimes' },
              { factor: 'Socioeconomic Signals', weight: 20, impact: 'medium', desc: 'Employment data and festival calendar factored into model' },
              { factor: 'Recent Anomalies', weight: 15, impact: 'high', desc: 'Whitefield 3σ spike increases short-term robbery forecast' },
            ].map(f => (
              <div key={f.factor}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ fontWeight: 500 }}>{f.factor}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-label text-muted">{f.weight}% weight</span>
                    <span className={`badge badge-${f.impact}`}>{f.impact}</span>
                  </div>
                </div>
                <div className="text-caption text-secondary mb-1">{f.desc}</div>
                <div className="progress-bar">
                  <div className={`progress-fill ${f.impact}`} style={{ width: `${f.weight * 2.5}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="alert-banner info mt-4" style={{ padding: '10px 12px' }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <div className="text-caption text-secondary">
              Model: Catalyst Zia AutoML LSTM · Last trained: 6 hrs ago · Accuracy: 84.7%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
