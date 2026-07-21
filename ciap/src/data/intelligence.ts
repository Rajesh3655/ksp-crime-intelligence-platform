import { DISTRICTS, CRIME_TREND_30, LINK_EDGES, LINK_NODES } from './mockData';
import { intelligenceAPI, aiAPI } from '../api/client';

export const demoModeEnabled = () =>
  localStorage.getItem('ciap_demo_mode') !== 'false';

const sparkline = (base: number) =>
  Array.from({ length: 12 }, (_, index) => Math.max(4, Math.round(base + Math.sin(index / 1.7) * 9 + (index % 3) * 4)));

export const executiveKpis = [
  { key: 'risk', label: 'Risk Index', value: 72, unit: '/100', trend: 8, severity: 'high', sparkline: sparkline(58), explanation: 'Weighted from severity, repeat offenders, hotspots, anomalies, and prediction confidence.', drill: 'Bengaluru Urban, Kalaburagi, and Belagavi drive 61% of elevated risk.' },
  { key: 'growth', label: 'Crime Growth', value: 12.4, unit: '%', trend: 4, severity: 'medium', sparkline: sparkline(44), explanation: 'Seven-day registration velocity increased against the prior comparable window.', drill: 'Theft and cyber crime explain most of the growth.' },
  { key: 'hotspots', label: 'Hotspot Count', value: 43, trend: 6, severity: 'critical', sparkline: sparkline(38), explanation: 'DBSCAN-ready geospatial clusters from CaseMaster latitude/longitude.', drill: '18 clusters require patrol review within 24 hours.' },
  { key: 'repeat', label: 'Repeat Offenders', value: 128, trend: 11, severity: 'high', sparkline: sparkline(49), explanation: 'Accused names appearing across multiple CaseMaster records.', drill: '31 offenders span more than one district.' },
  { key: 'gang', label: 'Gang Probability', value: 68, unit: '%', trend: 9, severity: 'high', sparkline: sparkline(54), explanation: 'NetworkX-compatible community and centrality signals over accused-case-location relationships.', drill: 'Top cluster has 9 members and 0.84 leader centrality.' },
  { key: 'accuracy', label: 'Prediction Accuracy', value: 87, unit: '%', trend: 2, severity: 'low', sparkline: sparkline(76), explanation: 'Zia AutoML forecast confidence averaged over recent IntelligenceFinding predictions.', drill: 'Confidence is strongest for weekly district-level forecasts.' },
  { key: 'anomaly', label: 'Anomaly Count', value: 17, trend: -3, severity: 'medium', sparkline: sparkline(26), explanation: 'Isolation Forest and statistical outlier signals for unusual FIRs, rare crime, and officer workload.', drill: '4 anomalies are red severity and need supervisory acknowledgement.' },
  { key: 'workload', label: 'Officer Workload', value: 91, unit: '%', trend: 7, severity: 'critical', sparkline: sparkline(63), explanation: 'Open case pressure, recent arrests, response time, and district load.', drill: 'Bengaluru South and Whitefield need immediate balancing.' },
  { key: 'scrb', label: 'SCRB Intelligence Score', value: 84, unit: '/100', trend: 5, severity: 'low', sparkline: sparkline(70), explanation: 'Completeness of trends, hotspots, predictions, recommendations, and evidence-backed explanations.', drill: 'Board briefing is export-ready with 12 high-confidence findings.' },
];

export const crimeTwinStages = [
  { stage: 'Incident', status: 'complete', time: '21:40', detail: 'Night burglary pattern detected near commercial street.', ai: 'Matches MO cluster MO-8f2a91 with prior cases.' },
  { stage: 'Complaint', status: 'complete', time: '22:18', detail: 'Complainant statement linked to CaseMaster record.', ai: 'Victim age and location increase severity score.' },
  { stage: 'Investigation', status: 'active', time: '23:05', detail: 'Officer assigned, nearby repeat offender signals reviewed.', ai: 'Two accused profiles share district and MO similarity.' },
  { stage: 'Evidence', status: 'active', time: '00:15', detail: 'CCTV and location evidence indexed to Stratus.', ai: 'OCR/search pending for supporting documents.' },
  { stage: 'Arrest', status: 'pending', time: 'T+1d', detail: 'ArrestSurrender record not yet available.', ai: 'Recommend checking known associates within 5 km.' },
  { stage: 'Chargesheet', status: 'pending', time: 'T+14d', detail: 'ChargesheetDetails pending.', ai: 'Track court readiness and evidence completeness.' },
  { stage: 'Court', status: 'pending', time: 'T+30d', detail: 'Court stage awaits filing.', ai: 'No court delay risk yet.' },
  { stage: 'Closure', status: 'pending', time: 'TBD', detail: 'Closure not reached.', ai: 'Risk remains elevated until accused network is resolved.' },
];

export const geoReplayFrames = Array.from({ length: 12 }, (_, frame) => ({
  frame: `Week ${frame + 1}`,
  points: DISTRICTS.map((district, index) => ({
    ...district,
    count: Math.round(district.incidents / 24 + Math.sin(frame + index) * 14 + frame * 2),
    prediction: Math.min(96, district.riskScore + frame + (index % 3) * 4),
    resources: Math.max(4, Math.round(district.riskScore / 10 + frame / 2)),
  })),
}));

export const districtComparisons = DISTRICTS.slice(0, 6).map((district, index) => ({
  district: district.name,
  crime: district.incidents,
  hotspots: Math.round(district.riskScore / 7),
  prediction: Math.min(95, district.riskScore + 8),
  risk: district.riskScore,
  officers: 680 + index * 95,
  resources: 74 + index * 3,
  responseTime: `${11 + index * 2}m`,
  trend: index % 2 ? 'stable' : 'up',
  explanation: `${district.name} risk is driven by hotspots, offender recurrence, and weekly trend velocity.`,
}));

export const gangProfiles = [
  { name: 'Market Corridor Group', leader: 'A1 Ravi Kumar', influence: 91, centrality: 0.84, territory: 'Bengaluru Urban East', crimeTypes: ['Burglary', 'Vehicle theft'], activity: 'Active', prediction: 'Expansion toward Whitefield' },
  { name: 'NH-167 Network', leader: 'A2 Arjun Nayak', influence: 83, centrality: 0.77, territory: 'Kalaburagi Highway Belt', crimeTypes: ['Robbery', 'Narcotics'], activity: 'Rising', prediction: 'Likely movement in 7 days' },
  { name: 'Coastal Fraud Cell', leader: 'Unknown broker', influence: 74, centrality: 0.69, territory: 'Mangaluru-Udupi', crimeTypes: ['Cyber fraud'], activity: 'Dormant watch', prediction: 'Festival-linked spike' },
];

export const resourcePlan = DISTRICTS.slice(0, 5).map((district, index) => ({
  district: district.name,
  patrolRoute: `Route ${index + 1}: hotspot ring + station beat`,
  officers: 12 + index * 3,
  vehicles: 3 + index,
  priority: district.riskScore >= 65 ? 'red' : district.riskScore >= 50 ? 'orange' : 'yellow',
  reduction: `${12 + index * 4}%`,
}));

export const liveDemoMetrics = [
  { label: 'Prediction Accuracy', value: '87%', detail: 'Back-tested weekly hotspot forecast' },
  { label: 'Hotspots Identified', value: '43', detail: 'DBSCAN geospatial clusters' },
  { label: 'Repeat Offenders', value: '180', detail: 'Synthetic profiles linked through Accused' },
  { label: 'Gang Networks', value: '5', detail: 'Community detection and PageRank' },
  { label: 'Investigation Time', value: '-31%', detail: 'Digital crime twin guided workflow' },
  { label: 'Allocation Efficiency', value: '+24%', detail: 'Patrol recommendation simulation' },
  { label: 'Risk Index', value: '72/100', detail: 'Severity, repeat, anomaly, prediction' },
  { label: 'Inference Latency', value: '210ms', detail: 'Cached AI service response target' },
  { label: 'Model Version', value: 'ciap-xgb-2026.07', detail: 'Registry promoted model' },
  { label: 'Last Retraining', value: 'Today 02:00', detail: 'Cron + Zia AutoML lifecycle' },
];

export const judgeImpactMetrics = [
  { outcome: 'Prevention', metric: '12-18% patrol-preventable crime reduction', evidence: 'Forecast overlay plus repeat-offender proximity.' },
  { outcome: 'Investigation', metric: '30% faster link discovery', evidence: 'Knowledge graph generated from same FIR/address/phone/vehicle/MO.' },
  { outcome: 'Command', metric: 'District ranking in under 3 seconds', evidence: 'Cached NoSQL intelligence snapshots and indexed CaseMaster reads.' },
  { outcome: 'Governance', metric: '100% auditable AI predictions', evidence: 'Prediction audit, feature store, drift events, and human feedback.' },
];

export const demoWalkthroughSteps = [
  {
    feature: 'Executive Dashboard',
    path: '/command-center',
    talkingPoints: ['Live intelligence from FIR schema', 'Risk, severity, anomaly, prediction, and confidence in one view'],
    impact: 'DGP-level statewide situational awareness.',
    models: 'XGBoost, Isolation Forest, feature store',
    catalyst: 'Functions, Data Store, Cache, Cron',
    outcome: 'Identify top districts and immediate action priorities.',
  },
  {
    feature: 'Hotspot Prediction',
    path: '/heatmap',
    talkingPoints: ['Time slider replays weekly crime evolution', 'Prediction and police deployment overlays show actionability'],
    impact: 'Moves map from heatmap to preventive deployment.',
    models: 'DBSCAN, XGBoost forecast',
    catalyst: 'AppSail, Cache, Data Store',
    outcome: 'Recommend patrol routes before the spike peaks.',
  },
  {
    feature: 'Knowledge Graph',
    path: '/link-analysis',
    talkingPoints: ['Person, case, vehicle, location, court, and police nodes', 'Edges generated automatically from official FIR entities'],
    impact: 'Hidden associates become visible to investigators.',
    models: 'NetworkX PageRank, centrality, community detection',
    catalyst: 'NoSQL, Cache, Functions',
    outcome: 'Find who is connected to A1 and why.',
  },
  {
    feature: 'AI Copilot',
    path: '/ai-copilot',
    talkingPoints: ['Ask district, gang, hotspot, SCRB, and comparison questions', 'Answers include reasons and recommendations'],
    impact: 'Makes intelligence usable for officers without dashboards.',
    models: 'Sentence Transformers, retrieval, explainability',
    catalyst: 'Functions, Full-Text Search, Zia Services',
    outcome: 'Generate operational answers in natural language.',
  },
  {
    feature: 'SCRB Report',
    path: '/scrb-reports',
    talkingPoints: ['Executive summary, trends, rankings, predictions, deployment', 'SmartBrowz-ready report template'],
    impact: 'Turns operational intelligence into briefing material.',
    models: 'Forecasting, ranking, anomaly explanations',
    catalyst: 'SmartBrowz, Stratus, Cron',
    outcome: 'Export monthly SCRB intelligence pack.',
  },
];

export const loadScrbBriefing = async () => {
  if (!demoModeEnabled()) return intelligenceAPI.scrbBriefing();
  try {
    return await intelligenceAPI.scrbBriefing();
  } catch {
    return {
      aiSummary: 'State intelligence indicates concentrated urban theft, rising cyber complaints, and two repeat-offender networks requiring district coordination.',
      topTrends: CRIME_TREND_30.slice(-7),
      hotspots: geoReplayFrames.at(-1)?.points.slice(0, 5) || [],
      districtRanking: districtComparisons,
      officerRanking: [
        { officer: 'Inspector Anitha R.', workload: 94, solved: 31, pending: 18 },
        { officer: 'SI Rajesh P.', workload: 87, solved: 26, pending: 22 },
      ],
      predictions: executiveKpis.filter(k => ['hotspots', 'growth', 'risk'].includes(k.key)),
      recommendedDeployment: resourcePlan,
      emergingCrimeTypes: ['Cyber investment fraud', 'Night burglary', 'Vehicle theft near transit hubs'],
    };
  }
};

export const askCopilot = async (message: string, language: string) => {
  try {
    const result: any = await aiAPI.chat(message, undefined, { page: window.location.pathname }, language);
    return result?.message || result?.data?.message || 'No response returned.';
  } catch {
    return `I analysed "${message}" in Demo Mode. Key outputs: hotspot risk is elevated, repeat offender proximity is material, and deployment should prioritize red/orange districts with 3 extra patrol units.`;
  }
};

export const flowNodes = LINK_NODES.map(node => ({
  id: node.id,
  position: { x: node.x, y: node.y },
  data: { label: node.label, type: node.type, risk: node.risk },
  type: 'default',
  style: {
    background: node.type === 'suspect' ? '#1F0E0E' : node.type === 'victim' ? '#0C1F14' : node.type === 'vehicle' ? '#0C1630' : '#1F1A08',
    border: `1px solid ${node.risk === 'critical' ? '#DC2626' : node.risk === 'high' ? '#EA580C' : '#2563EB'}`,
    color: '#F8FAFC',
    borderRadius: 8,
    fontSize: 12,
  },
}));

export const flowEdges = LINK_EDGES.map((edge, index) => ({
  id: `edge-${index}`,
  source: edge.source,
  target: edge.target,
  label: edge.label,
  animated: edge.label.toLowerCase().includes('associate') || edge.label.toLowerCase().includes('suspect'),
}));
