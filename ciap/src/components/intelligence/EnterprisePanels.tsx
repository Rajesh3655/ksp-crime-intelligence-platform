import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Brain, ChevronRight, Crosshair, Download,
  Fingerprint, GitBranch, MapPin, Route, Shield, Sparkles, Users,
} from 'lucide-react';
import {
  crimeTwinStages, districtComparisons, executiveKpis, gangProfiles,
  judgeImpactMetrics, liveDemoMetrics, resourcePlan,
} from '../../data/intelligence';

const severityClass = (severity: string) =>
  severity === 'critical' || severity === 'red' ? 'critical'
    : severity === 'high' || severity === 'orange' ? 'high'
      : severity === 'medium' || severity === 'yellow' ? 'medium'
        : 'low';

export const Sparkline: React.FC<{ values: number[]; color?: string }> = ({ values, color = 'var(--accent-primary)' }) => {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${26 - (value / max) * 22}`).join(' ');
  return (
    <svg viewBox="0 0 100 28" className="intel-sparkline" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const ExplainableAICard: React.FC<{
  title: string;
  prediction: string;
  confidence: number;
  features: string[];
  evidence?: string[];
  recommendation: string;
}> = ({ title, prediction, confidence, features, evidence = [], recommendation }) => (
  <motion.div className="intel-card explain-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <div className="intel-card-header">
      <div className="intel-title"><Brain size={15} /> {title}</div>
      <span className={`badge badge-${confidence >= 90 ? 'low' : confidence >= 75 ? 'high' : 'medium'}`}>{confidence}%</span>
    </div>
    <div className="explain-prediction">{prediction}</div>
    <div className="explain-grid">
      <div>
        <div className="intel-label">Important Features</div>
        {features.map(item => <div className="intel-row" key={item}><Sparkles size={12} /> {item}</div>)}
      </div>
      <div>
        <div className="intel-label">Historical Evidence</div>
        {(evidence.length ? evidence : ['Similar CaseMaster records in prior 3-year pattern', 'Repeat offender and same-MO signals nearby']).map(item => (
          <div className="intel-row" key={item}><Fingerprint size={12} /> {item}</div>
        ))}
      </div>
    </div>
    <div className="recommendation"><Shield size={14} /> {recommendation}</div>
  </motion.div>
);

export const ExecutiveKpiGrid: React.FC = () => {
  const [active, setActive] = useState(executiveKpis[0]);
  return (
    <>
      <div className="intel-kpi-grid">
        {executiveKpis.map((kpi, index) => (
          <motion.button
            key={kpi.key}
            className={`intel-kpi ${active.key === kpi.key ? 'active' : ''} ${severityClass(kpi.severity)}`}
            onClick={() => setActive(kpi)}
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
          >
            <span className="intel-label">{kpi.label}</span>
            <span className="intel-kpi-value">{kpi.value}<small>{kpi.unit}</small></span>
            <Sparkline values={kpi.sparkline} />
            <span className={`kpi-delta ${kpi.trend >= 0 ? 'up' : 'down'}`}>{kpi.trend >= 0 ? '+' : ''}{kpi.trend}% trend</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active.key} className="intel-drill-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <div>
            <div className="intel-title"><Activity size={15} /> {active.label} Drilldown</div>
            <p>{active.explanation}</p>
            <p className="text-secondary">{active.drill}</p>
          </div>
          <button className="btn btn-primary btn-sm">Open Intelligence <ChevronRight size={13} /></button>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export const DigitalCrimeTwin: React.FC = () => {
  const [selected, setSelected] = useState(crimeTwinStages[2]);
  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <div className="intel-title"><GitBranch size={15} /> Digital Crime Twin</div>
        <span className="badge badge-info">Case replay</span>
      </div>
      <div className="crime-twin">
        {crimeTwinStages.map((stage, index) => (
          <button key={stage.stage} className={`twin-stage ${stage.status} ${selected.stage === stage.stage ? 'active' : ''}`} onClick={() => setSelected(stage)}>
            <span className="twin-dot">{index + 1}</span>
            <span>{stage.stage}</span>
          </button>
        ))}
      </div>
      <motion.div className="twin-detail" key={selected.stage} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center justify-between">
          <strong>{selected.stage}</strong>
          <span className="text-caption text-muted">{selected.time}</span>
        </div>
        <p>{selected.detail}</p>
        <div className="recommendation"><Brain size={14} /> {selected.ai}</div>
      </motion.div>
    </div>
  );
};

export const DistrictComparisonPanel: React.FC = () => (
  <div className="intel-card">
    <div className="intel-card-header">
      <div className="intel-title"><MapPin size={15} /> District Comparison</div>
      <span className="badge badge-info">Risk + resources</span>
    </div>
    <div className="intel-table-scroll">
      <table className="data-table compact">
        <thead><tr><th>District</th><th>Crime</th><th>Hotspots</th><th>Risk</th><th>Resources</th><th>AI</th></tr></thead>
        <tbody>
          {districtComparisons.map(row => (
            <tr key={row.district}>
              <td>{row.district}</td>
              <td>{row.crime.toLocaleString()}</td>
              <td>{row.hotspots}</td>
              <td><span className={`badge badge-${row.risk >= 65 ? 'critical' : row.risk >= 50 ? 'high' : 'medium'}`}>{row.risk}</span></td>
              <td>{row.resources}%</td>
              <td className="text-caption text-secondary">{row.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const GangIntelligencePanel: React.FC = () => (
  <div className="intel-card">
    <div className="intel-card-header">
      <div className="intel-title"><Users size={15} /> Gang Intelligence</div>
      <span className="badge badge-high">NetworkX</span>
    </div>
    <div className="gang-grid">
      {gangProfiles.map(gang => (
        <motion.div key={gang.name} className="gang-card" whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between">
            <strong>{gang.name}</strong>
            <span className="badge badge-critical">{gang.influence}</span>
          </div>
          <div className="text-caption text-muted">Leader: {gang.leader}</div>
          <div className="mini-meter"><span style={{ width: `${gang.centrality * 100}%` }} /></div>
          <div className="text-caption text-secondary">{gang.territory} · {gang.crimeTypes.join(', ')}</div>
          <div className="recommendation"><Crosshair size={13} /> {gang.prediction}</div>
        </motion.div>
      ))}
    </div>
  </div>
);

export const ResourceOptimizerPanel: React.FC = () => (
  <div className="intel-card">
    <div className="intel-card-header">
      <div className="intel-title"><Route size={15} /> Resource Optimizer</div>
      <button className="btn btn-secondary btn-sm"><Download size={13} /> Export</button>
    </div>
    <div className="resource-plan-grid">
      {resourcePlan.map(plan => (
        <div className="resource-plan" key={plan.district}>
          <span className={`status-dot ${severityClass(plan.priority)}`} />
          <div>
            <strong>{plan.district}</strong>
            <p>{plan.patrolRoute}</p>
            <span className="text-caption text-muted">{plan.officers} officers · {plan.vehicles} vehicles · estimated reduction {plan.reduction}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CrimeDnaPanel: React.FC = () => {
  const [score] = useState(78);
  const metrics = [
    ['MO Similarity', 84], ['Language Similarity', 72], ['Location Similarity', 69],
    ['Time Similarity', 81], ['Accused Similarity', 64], ['Victim Similarity', 58], ['Crime Type Similarity', 89],
  ];
  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <div className="intel-title"><Fingerprint size={15} /> Crime DNA Engine</div>
        <span className="badge badge-high">{score}% match</span>
      </div>
      <div className="dna-score">Possibly same offender</div>
      {metrics.map(([label, value]) => (
        <div className="dna-row" key={label as string}>
          <span>{label}</span>
          <div className="mini-meter"><span style={{ width: `${value}%` }} /></div>
          <strong>{value}%</strong>
        </div>
      ))}
    </div>
  );
};

export const TimelineAnalyticsPanel: React.FC = () => (
  <div className="intel-card">
    <div className="intel-card-header">
      <div className="intel-title"><AlertTriangle size={15} /> Timeline Analytics</div>
      <span className="badge badge-medium">24h wheel</span>
    </div>
    <div className="crime-wheel">
      {Array.from({ length: 24 }, (_, hour) => (
        <span key={hour} style={{ transform: `rotate(${hour * 15}deg)`, height: `${34 + Math.sin(hour) * 18 + (hour >= 20 || hour <= 3 ? 18 : 0)}%` }} title={`${hour}:00`} />
      ))}
      <strong>Night surge</strong>
    </div>
    <ExplainableAICard
      title="Seasonality Signal"
      prediction="Festival week risk elevated"
      confidence={91}
      features={['Weekend clustering', 'Night crimes', 'Prior 3-year festival pattern']}
      recommendation="Deploy extra night patrols around transit and market corridors."
    />
  </div>
);

export const JudgeImpactPanel: React.FC = () => (
  <div className="intel-card judge-impact">
    <div className="intel-card-header">
      <div className="intel-title"><Shield size={15} /> Judge Impact Dashboard</div>
      <span className="badge badge-info">Demo telemetry</span>
    </div>
    <div className="live-metric-grid">
      {liveDemoMetrics.map(metric => (
        <div className="live-metric" key={metric.label}>
          <span className="intel-label">{metric.label}</span>
          <strong>{metric.value}</strong>
          <p>{metric.detail}</p>
        </div>
      ))}
    </div>
    <div className="impact-outcomes">
      {judgeImpactMetrics.map(item => (
        <div className="impact-row" key={item.outcome}>
          <strong>{item.outcome}</strong>
          <span>{item.metric}</span>
          <p>{item.evidence}</p>
        </div>
      ))}
    </div>
  </div>
);
