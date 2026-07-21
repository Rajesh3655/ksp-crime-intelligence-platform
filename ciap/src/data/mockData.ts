// Mock data for all platform modules
import { format, subDays, addDays } from 'date-fns';

// ── Districts ──────────────────────────────────────────────────────────────
export const DISTRICTS = [
  { id: 'BLR', name: 'Bengaluru Urban', name_kn: 'ಬೆಂಗಳೂರು ನಗರ', riskScore: 72, incidents: 1247, lat: 12.9716, lng: 77.5946 },
  { id: 'MYS', name: 'Mysuru', name_kn: 'ಮೈಸೂರು', riskScore: 45, incidents: 423, lat: 12.2958, lng: 76.6394 },
  { id: 'MNG', name: 'Mangaluru', name_kn: 'ಮಂಗಳೂರು', riskScore: 38, incidents: 312, lat: 12.8698, lng: 74.8426 },
  { id: 'HUB', name: 'Hubballi-Dharwad', name_kn: 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ', riskScore: 58, incidents: 534, lat: 15.3647, lng: 75.1240 },
  { id: 'BEL', name: 'Belagavi', name_kn: 'ಬೆಳಗಾವಿ', riskScore: 61, incidents: 478, lat: 15.8497, lng: 74.4977 },
  { id: 'KLB', name: 'Kalaburagi', name_kn: 'ಕಲಬುರಗಿ', riskScore: 67, incidents: 589, lat: 17.3297, lng: 76.8343 },
  { id: 'BAL', name: 'Ballari', name_kn: 'ಬಳ್ಳಾರಿ', riskScore: 54, incidents: 401, lat: 15.1394, lng: 76.9214 },
  { id: 'SHI', name: 'Shivamogga', name_kn: 'ಶಿವಮೊಗ್ಗ', riskScore: 42, incidents: 287, lat: 13.9299, lng: 75.5681 },
  { id: 'TUM', name: 'Tumakuru', name_kn: 'ತುಮಕೂರು', riskScore: 48, incidents: 356, lat: 13.3379, lng: 77.1173 },
  { id: 'DAV', name: 'Davangere', name_kn: 'ದಾವಣಗೆರೆ', riskScore: 51, incidents: 389, lat: 14.4644, lng: 75.9218 },
  { id: 'VIJ', name: 'Vijayapura', name_kn: 'ವಿಜಯಪುರ', riskScore: 63, incidents: 445, lat: 16.8302, lng: 75.7100 },
  { id: 'RMN', name: 'Ramanagara', name_kn: 'ರಾಮನಗರ', riskScore: 36, incidents: 198, lat: 12.7161, lng: 77.2807 },
];

// ── KPI Summary ────────────────────────────────────────────────────────────
export const STATE_KPIs = {
  incidentsToday: 183,
  incidentsDelta: +12,
  openFIRs: 4821,
  openFIRsDelta: -34,
  activeAlerts: 7,
  alertsDelta: +2,
  hotspotDistricts: 4,
  hotspotDelta: 0,
  stateRiskScore: 64,
  riskDelta: +3,
  arrestsToday: 67,
  arrestsDelta: +8,
  resourcesDeployed: 12450,
  resourcesDelta: +220,
  closureRate: 78.4,
};

// ── Crime Trend (30 days) ──────────────────────────────────────────────────
export const CRIME_TREND_30 = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(new Date(), 29 - i);
  return {
    date: format(date, 'MMM dd'),
    theft: Math.floor(40 + Math.random() * 30),
    assault: Math.floor(15 + Math.random() * 20),
    robbery: Math.floor(8 + Math.random() * 12),
    cybercrime: Math.floor(20 + Math.random() * 25),
    murder: Math.floor(1 + Math.random() * 4),
    total: 0,
  };
}).map(d => ({ ...d, total: d.theft + d.assault + d.robbery + d.cybercrime + d.murder }));

// ── Forecast Data ──────────────────────────────────────────────────────────
export const FORECAST_7DAY = Array.from({ length: 7 }, (_, i) => ({
  date: format(addDays(new Date(), i + 1), 'EEE MMM dd'),
  predicted: Math.floor(150 + Math.random() * 60),
  lower: Math.floor(130 + Math.random() * 30),
  upper: Math.floor(200 + Math.random() * 40),
  confidence: Math.floor(82 + Math.random() * 12),
}));

export const FORECAST_30DAY = Array.from({ length: 30 }, (_, i) => ({
  date: format(addDays(new Date(), i + 1), 'MMM dd'),
  predicted: Math.floor(140 + Math.random() * 80),
  lower: Math.floor(110 + Math.random() * 40),
  upper: Math.floor(190 + Math.random() * 60),
  confidence: Math.floor(70 + Math.random() * 20),
}));

// ── Recent Incidents ───────────────────────────────────────────────────────
export const RECENT_INCIDENTS = [
  { id: 'INC-2024-08741', fir: 'BLR/2024/4821', type: 'Robbery', district: 'Bengaluru Urban', station: 'Cubbon Park', severity: 'high', status: 'open', time: '14 mins ago', lat: 12.9766, lng: 77.5993 },
  { id: 'INC-2024-08740', fir: 'KLB/2024/1203', type: 'Cybercrime', district: 'Kalaburagi', station: 'Kalaburagi North', severity: 'medium', status: 'pending', time: '27 mins ago', lat: 17.3297, lng: 76.8343 },
  { id: 'INC-2024-08739', fir: 'HUB/2024/2341', type: 'Assault', district: 'Hubballi-Dharwad', station: 'Hubballi Town', severity: 'critical', status: 'open', time: '41 mins ago', lat: 15.3647, lng: 75.1240 },
  { id: 'INC-2024-08738', fir: 'MYS/2024/0891', type: 'Theft', district: 'Mysuru', station: 'Devaraja', severity: 'low', status: 'open', time: '1 hr ago', lat: 12.2958, lng: 76.6394 },
  { id: 'INC-2024-08737', fir: 'BEL/2024/1567', type: 'Murder', district: 'Belagavi', station: 'Belagavi Camp', severity: 'critical', status: 'open', time: '1.5 hrs ago', lat: 15.8497, lng: 74.4977 },
  { id: 'INC-2024-08736', fir: 'VIJ/2024/0423', type: 'Drug Offences', district: 'Vijayapura', station: 'Vijayapura Town', severity: 'high', status: 'pending', time: '2 hrs ago', lat: 16.8302, lng: 75.7100 },
  { id: 'INC-2024-08735', fir: 'BLR/2024/4820', type: 'Cybercrime', district: 'Bengaluru Urban', station: 'Whitefield', severity: 'medium', status: 'open', time: '2.5 hrs ago', lat: 12.9698, lng: 77.7500 },
  { id: 'INC-2024-08734', fir: 'SHI/2024/0312', type: 'Kidnapping', district: 'Shivamogga', station: 'Shivamogga Town', severity: 'critical', status: 'escalated', time: '3 hrs ago', lat: 13.9299, lng: 75.5681 },
];

// ── Alerts ─────────────────────────────────────────────────────────────────
export const ALERTS = [
  { id: 'ALT-001', type: 'Anomaly Spike', severity: 'critical', district: 'Bengaluru Urban', message: 'Robbery incidents increased by 340% in Whitefield zone — 3σ anomaly detected', time: '8 mins ago', status: 'active', assignee: null },
  { id: 'ALT-002', type: 'Gang Activity', severity: 'critical', district: 'Kalaburagi', message: 'Organised gang movement detected near NH-167 — intelligence signal triggered', time: '22 mins ago', status: 'active', assignee: 'SP Kalaburagi' },
  { id: 'ALT-003', type: 'Risk Threshold', severity: 'high', district: 'Belagavi', message: 'District risk score crossed 60 threshold — preventive deployment recommended', time: '45 mins ago', status: 'acknowledged', assignee: 'DCP Belagavi' },
  { id: 'ALT-004', type: 'Missing Person', severity: 'high', district: 'Mysuru', message: 'Missing child report — amber alert protocol initiated, GPS trace active', time: '1.2 hrs ago', status: 'active', assignee: 'Inspector Rao' },
  { id: 'ALT-005', type: 'Cybercrime Surge', severity: 'medium', district: 'Bengaluru Urban', message: 'Online financial fraud reports up 28% this week — cybercrime unit alerted', time: '2 hrs ago', status: 'acknowledged', assignee: 'CyberCell' },
  { id: 'ALT-006', type: 'Crowd Event Risk', severity: 'medium', district: 'Mysuru', message: 'Dasara event security — crowd density exceeding safe thresholds in 2 zones', time: '3 hrs ago', status: 'active', assignee: 'Event Security' },
  { id: 'ALT-007', type: 'Patrol Gap', severity: 'low', district: 'Shivamogga', message: 'Night patrol coverage gap detected in Bhadravathi sector', time: '4 hrs ago', status: 'acknowledged', assignee: null },
];

// ── FIR Records ────────────────────────────────────────────────────────────
export const FIR_RECORDS = Array.from({ length: 40 }, (_, i) => {
  const districts = ['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Kalaburagi'];
  const types = ['Theft', 'Assault', 'Robbery', 'Cybercrime', 'Murder', 'Drug Offences', 'Kidnapping', 'Fraud'];
  const statuses = ['open', 'pending', 'closed', 'escalated'];
  const severities = ['critical', 'high', 'medium', 'low'];
  const d = districts[i % districts.length];
  const prefix = d.slice(0, 3).toUpperCase();
  return {
    id: `INC-2024-${String(8741 - i).padStart(5, '0')}`,
    firNumber: `${prefix}/2024/${String(4821 - i).padStart(4, '0')}`,
    date: format(subDays(new Date(), i), 'dd MMM yyyy'),
    type: types[i % types.length],
    district: d,
    station: `${d} Central`,
    severity: severities[i % severities.length],
    status: statuses[i % statuses.length],
    assignedTo: i % 3 === 0 ? 'Inspector Sharma' : i % 3 === 1 ? 'SI Reddy' : 'ASI Nair',
    victim: `Victim ${i + 1}`,
    description: `Crime incident reported at ${d}. FIR lodged at police station. Investigation in progress.`,
  };
});

// ── Risk Scores ────────────────────────────────────────────────────────────
export const RISK_SCORES = DISTRICTS.map(d => ({
  ...d,
  factors: {
    crimeRate: Math.floor(d.riskScore * 0.4 + Math.random() * 10),
    recidivism: Math.floor(d.riskScore * 0.2 + Math.random() * 10),
    socioeconomic: Math.floor(d.riskScore * 0.25 + Math.random() * 10),
    infrastructure: Math.floor(d.riskScore * 0.15 + Math.random() * 10),
  },
  trend: d.riskScore > 60 ? 'up' : d.riskScore > 45 ? 'stable' : 'down',
  lastComputed: '10 mins ago',
}));

// ── Link Analysis Nodes ────────────────────────────────────────────────────
export const LINK_NODES = [
  { id: 'S1', label: 'Ravi Kumar', type: 'suspect', x: 400, y: 250, risk: 'critical' },
  { id: 'S2', label: 'Arjun Nayak', type: 'suspect', x: 600, y: 180, risk: 'high' },
  { id: 'S3', label: 'Suresh Babu', type: 'suspect', x: 550, y: 380, risk: 'high' },
  { id: 'V1', label: 'Priya Sharma', type: 'victim', x: 200, y: 200, risk: 'low' },
  { id: 'V2', label: 'Mohan Das', type: 'victim', x: 220, y: 360, risk: 'low' },
  { id: 'L1', label: 'MG Road', type: 'location', x: 350, y: 420, risk: 'medium' },
  { id: 'L2', label: 'Whitefield', type: 'location', x: 680, y: 300, risk: 'high' },
  { id: 'VH1', label: 'KA-01-AB-1234', type: 'vehicle', x: 480, y: 100, risk: 'medium' },
  { id: 'VH2', label: 'KA-09-CD-5678', type: 'vehicle', x: 300, y: 130, risk: 'high' },
  { id: 'E1', label: 'Case INC-08741', type: 'event', x: 150, y: 300, risk: 'critical' },
];

export const LINK_EDGES = [
  { source: 'S1', target: 'S2', label: 'Associate' },
  { source: 'S1', target: 'S3', label: 'Known to' },
  { source: 'S2', target: 'L2', label: 'Spotted at' },
  { source: 'S3', target: 'L1', label: 'Arrested at' },
  { source: 'S1', target: 'VH1', label: 'Owner' },
  { source: 'S2', target: 'VH2', label: 'Driver' },
  { source: 'V1', target: 'E1', label: 'Victim in' },
  { source: 'V2', target: 'E1', label: 'Witness to' },
  { source: 'S1', target: 'E1', label: 'Suspect in' },
  { source: 'VH1', target: 'L2', label: 'Seen at' },
];

// ── Citizen Reports ────────────────────────────────────────────────────────
export const CITIZEN_REPORTS = [
  { id: 'CR-001', description: 'Suspicious vehicles parked near market at night, possible gang activity', location: 'KR Market, Bengaluru', lat: 12.9632, lng: 77.5771, time: '2 hrs ago', status: 'pending', category: 'Gang Activity' },
  { id: 'CR-002', description: 'Drug peddling reported near school premises', location: 'Rajajinagar, Bengaluru', lat: 12.9922, lng: 77.5568, time: '5 hrs ago', status: 'verified', category: 'Drug Offences' },
  { id: 'CR-003', description: 'Chain snatching incident near ATM', location: 'Malleshwaram, Bengaluru', lat: 13.0037, lng: 77.5644, time: '8 hrs ago', status: 'verified', category: 'Theft' },
  { id: 'CR-004', description: 'Domestic dispute with suspected violence', location: 'Jayanagar, Bengaluru', lat: 12.9308, lng: 77.5838, time: '12 hrs ago', status: 'rejected', category: 'Domestic Violence' },
  { id: 'CR-005', description: 'Online fraud — lost Rs 85,000 to fake investment scheme', location: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245, time: '1 day ago', status: 'verified', category: 'Cybercrime' },
];

// ── Resource Allocation ────────────────────────────────────────────────────
export const RESOURCES = [
  { district: 'Bengaluru Urban', personnel: 4200, vehicles: 380, deployed: 3900, utilization: 93 },
  { district: 'Kalaburagi', personnel: 980, vehicles: 87, deployed: 810, utilization: 83 },
  { district: 'Belagavi', personnel: 1240, vehicles: 110, deployed: 980, utilization: 79 },
  { district: 'Mysuru', personnel: 1100, vehicles: 98, deployed: 840, utilization: 76 },
  { district: 'Hubballi-Dharwad', personnel: 1050, vehicles: 92, deployed: 780, utilization: 74 },
  { district: 'Vijayapura', personnel: 760, vehicles: 68, deployed: 540, utilization: 71 },
];

// ── Crime Category Distribution ────────────────────────────────────────────
export const CRIME_DISTRIBUTION = [
  { name: 'Theft', value: 34, color: '#3B82F6' },
  { name: 'Assault', value: 18, color: '#EA580C' },
  { name: 'Cybercrime', value: 21, color: '#6366F1' },
  { name: 'Robbery', value: 11, color: '#DC2626' },
  { name: 'Drug Offences', value: 9, color: '#D97706' },
  { name: 'Others', value: 7, color: '#64748B' },
];

// ── Users (Admin) ──────────────────────────────────────────────────────────
export const USERS = [
  { id: 'USR-001', name: 'Supt. Ramaiah K.', role: 'super_admin', district: 'State HQ', email: 'ramaiah@ksp.gov.in', status: 'active', lastLogin: '10 mins ago' },
  { id: 'USR-002', name: 'Analyst Priya S.', role: 'scrb_analyst', district: 'SCRB', email: 'priya.s@ksp.gov.in', status: 'active', lastLogin: '1 hr ago' },
  { id: 'USR-003', name: 'DCP Venkatesh M.', role: 'district_officer', district: 'Bengaluru Urban', email: 'venkatesh@ksp.gov.in', status: 'active', lastLogin: '2 hrs ago' },
  { id: 'USR-004', name: 'SI Rajesh P.', role: 'station_officer', district: 'Mysuru', email: 'rajesh.p@ksp.gov.in', status: 'active', lastLogin: '3 hrs ago' },
  { id: 'USR-005', name: 'Inspector Anitha R.', role: 'investigator', district: 'Hubballi-Dharwad', email: 'anitha.r@ksp.gov.in', status: 'inactive', lastLogin: '2 days ago' },
];

// ── Reports ────────────────────────────────────────────────────────────────
export const GENERATED_REPORTS = [
  { id: 'RPT-2024-06', name: 'Monthly Crime Report — June 2024', type: 'monthly', district: 'All Districts', createdAt: '01 Jul 2024', size: '2.4 MB', status: 'ready' },
  { id: 'RPT-2024-Q2', name: 'Q2 2024 Intelligence Briefing', type: 'quarterly', district: 'All Districts', createdAt: '05 Jul 2024', size: '8.1 MB', status: 'ready' },
  { id: 'RPT-SCRB-06', name: 'SCRB June 2024 Statistical Report', type: 'scrb', district: 'State', createdAt: '02 Jul 2024', size: '4.7 MB', status: 'ready' },
  { id: 'RPT-BLR-06', name: 'Bengaluru Urban Monthly — June 2024', type: 'monthly', district: 'Bengaluru Urban', createdAt: '01 Jul 2024', size: '1.9 MB', status: 'ready' },
  { id: 'RPT-2024-07-DRAFT', name: 'Monthly Crime Report — July 2024', type: 'monthly', district: 'All Districts', createdAt: '—', size: '—', status: 'generating' },
];

// ── Audit Logs ─────────────────────────────────────────────────────────────
export const AUDIT_LOGS = [
  { id: 'LOG-001', user: 'Supt. Ramaiah K.', action: 'User Created', resource: 'USR-006', ip: '10.0.1.45', time: '14:32:07' },
  { id: 'LOG-002', user: 'Analyst Priya S.', action: 'Report Generated', resource: 'RPT-2024-07-DRAFT', ip: '10.0.1.22', time: '14:28:44' },
  { id: 'LOG-003', user: 'DCP Venkatesh M.', action: 'Alert Acknowledged', resource: 'ALT-003', ip: '10.0.2.11', time: '14:15:21' },
  { id: 'LOG-004', user: 'SI Rajesh P.', action: 'FIR Updated', resource: 'BLR/2024/4821', ip: '10.0.3.88', time: '13:54:09' },
  { id: 'LOG-005', user: 'Inspector Anitha R.', action: 'Login', resource: 'Session', ip: '10.0.4.12', time: '13:40:00' },
];
