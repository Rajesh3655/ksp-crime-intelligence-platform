import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('demo-data');
fs.mkdirSync(outDir, { recursive: true });

const argCount = Number(process.argv.find(a => a.startsWith('--count='))?.split('=')[1] || 50000);
const count = Math.max(1000, Math.min(100000, argCount));
const seed = Number(process.argv.find(a => a.startsWith('--seed='))?.split('=')[1] || 20260721);

let state = seed;
const rand = () => {
  state = (state * 1664525 + 1013904223) >>> 0;
  return state / 0xffffffff;
};
const pick = arr => arr[Math.floor(rand() * arr.length)];
const pad = (n, w) => String(n).padStart(w, '0');
const csv = rows => rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

const districts = [
  [1, 'Bagalkote', 16.1725, 75.6557], [2, 'Ballari', 15.1394, 76.9214], [3, 'Belagavi', 15.8497, 74.4977],
  [4, 'Bengaluru Rural', 13.2847, 77.6078], [5, 'Bengaluru Urban', 12.9716, 77.5946], [6, 'Bidar', 17.9149, 77.5046],
  [7, 'Chamarajanagar', 11.9261, 76.9437], [8, 'Chikkaballapura', 13.4355, 77.7315], [9, 'Chikkamagaluru', 13.3153, 75.7754],
  [10, 'Chitradurga', 14.2251, 76.3980], [11, 'Dakshina Kannada', 12.8698, 74.8426], [12, 'Davanagere', 14.4644, 75.9218],
  [13, 'Dharwad', 15.4589, 75.0078], [14, 'Gadag', 15.4319, 75.6355], [15, 'Hassan', 13.0072, 76.0962],
  [16, 'Haveri', 14.7951, 75.3991], [17, 'Kalaburagi', 17.3297, 76.8343], [18, 'Kodagu', 12.3375, 75.8069],
  [19, 'Kolar', 13.1367, 78.1297], [20, 'Koppal', 15.3505, 76.1567], [21, 'Mandya', 12.5222, 76.9009],
  [22, 'Mysuru', 12.2958, 76.6394], [23, 'Raichur', 16.2076, 77.3463], [24, 'Ramanagara', 12.7203, 77.2811],
  [25, 'Shivamogga', 13.9299, 75.5681], [26, 'Tumakuru', 13.3379, 77.1173], [27, 'Udupi', 13.3409, 74.7421],
  [28, 'Uttara Kannada', 14.8185, 74.1416], [29, 'Vijayapura', 16.8302, 75.7100], [30, 'Yadgir', 16.7700, 77.1376],
  [31, 'Vijayanagara', 15.3173, 76.4600],
];
const subHeads = [
  [1, 1, 'Burglary'], [2, 1, 'Vehicle Theft'], [3, 1, 'Chain Snatching'], [4, 2, 'UPI Fraud'], [5, 2, 'Investment Scam'],
  [6, 3, 'Loan App Fraud'], [7, 4, 'Drug Distribution'], [8, 5, 'Harassment'], [9, 6, 'Assault'], [10, 6, 'Robbery'],
];
const stations = districts.flatMap(([districtId, name, lat, lng]) =>
  Array.from({ length: 8 }, (_, i) => ({
    UnitID: districtId * 100 + i + 1,
    UnitName: `${name} ${['Central', 'South', 'North', 'Rural', 'Market', 'Traffic', 'Cyber', 'Women'][i]} PS`,
    DistrictID: districtId,
    lat: lat + (rand() - 0.5) * 0.5,
    lng: lng + (rand() - 0.5) * 0.5,
  }))
);
const festivals = [
  ['Dasara', '2025-10-02', 0.34, ['Burglary', 'Chain Snatching']],
  ['Deepavali', '2025-10-20', 0.28, ['Burglary', 'Financial Fraud']],
  ['Ugadi', '2026-03-19', 0.18, ['Vehicle Theft']],
  ['Election Security Window', '2026-04-18', 0.16, ['Assault', 'Robbery']],
];
const gangs = ['Market Corridor Group', 'NH-167 Network', 'Coastal Fraud Cell', 'Ring Road Burglary Crew', 'North Belt Narcotics Line'];
const names = ['Ravi Kumar', 'Arjun Nayak', 'Suresh Babu', 'Imran Pasha', 'Prakash Gowda', 'Naveen H', 'Rizwan Khan', 'Manjunath S', 'Kiran R', 'Vijay Patil'];
const repeatOffenders = Array.from({ length: 180 }, (_, i) => ({ id: i + 1, name: `${pick(names)} A${i + 1}`, gang: rand() < 0.45 ? pick(gangs) : '' }));
const vehicles = Array.from({ length: 260 }, (_, i) => `KA-${pad(1 + Math.floor(rand() * 31), 2)}-${String.fromCharCode(65 + Math.floor(rand() * 26))}${String.fromCharCode(65 + Math.floor(rand() * 26))}-${pad(1000 + i, 4)}`);

const cases = [['CaseMasterID','CrimeNo','CaseNo','CrimeRegisteredDate','PolicePersonID','PoliceStationID','CaseCategoryID','GravityOffenceID','CrimeMajorHeadID','CrimeMinorHeadID','CaseStatusID','CourtID','IncidentFromDate','IncidentToDate','InfoReceivedPSDate','latitude','longitude','BriefFacts']];
const accused = [['AccusedMasterID','CaseMasterID','AccusedName','AgeYear','GenderID','PersonID']];
const victims = [['VictimMasterID','CaseMasterID','VictimName','AgeYear','GenderID','VictimPolice']];
const arrests = [['ArrestSurrenderID','CaseMasterID','ArrestSurrenderTypeID','ArrestSurrenderDate','ArrestSurrenderStateId','ArrestSurrenderDistrictId','PoliceStationID','IOID','CourtID','AccusedMasterID','IsAccused','IsComplainantAccused']];
const chargesheets = [['CSID','CaseMasterID','csdate','cstype','PolicePersonID']];
const scenarios = [];

for (let i = 1; i <= count; i++) {
  const station = pick(stations);
  let sub = pick(subHeads);
  let date = new Date(2024 + Math.floor(rand() * 3), Math.floor(rand() * 12), 1 + Math.floor(rand() * 27), Math.floor(rand() * 24), Math.floor(rand() * 60));
  const festival = festivals.find(([, festivalDate]) => Math.abs((date - new Date(festivalDate)) / 86400000) < 10);
  if (festival && rand() < festival[2]) {
    const matched = subHeads.filter(s => festival[3].includes(s[2]));
    if (matched.length) sub = pick(matched);
  }
  const isRepeat = rand() < 0.32;
  const offender = isRepeat ? pick(repeatOffenders) : null;
  const lat = station.lat + (rand() - 0.5) * 0.09;
  const lng = station.lng + (rand() - 0.5) * 0.09;
  const crimeNo = `1${pad(station.DistrictID, 4)}${pad(station.UnitID, 4)}${date.getFullYear()}${pad(i, 5)}`;
  const vehicle = rand() < 0.18 ? pick(vehicles) : '';
  const mo = `${sub[2]} reported near ${station.UnitName}. ${offender?.gang ? `Possible ${offender.gang} pattern. ` : ''}${vehicle ? `Vehicle ${vehicle} seen. ` : ''}${date.getHours() >= 20 || date.getHours() <= 4 ? 'Night-time MO. ' : ''}Evidence and witness inputs available for AI review.`;
  cases.push([i, crimeNo, `${date.getFullYear()}${pad(i, 5)}`, date.toISOString().slice(0,10), 1000 + (i % 700), station.UnitID, 1, sub[1] >= 4 ? 1 : 2, sub[1], sub[0], rand() < 0.64 ? 1 : 2, 500 + station.DistrictID, date.toISOString(), new Date(date.getTime() + (1 + Math.floor(rand() * 6)) * 3600000).toISOString(), new Date(date.getTime() + 3600000).toISOString(), lat.toFixed(7), lng.toFixed(7), mo]);
  const accusedCount = offender ? 1 + Math.floor(rand() * 3) : Math.floor(rand() * 2);
  for (let a = 0; a < accusedCount; a++) {
    const selected = a === 0 && offender ? offender.name : `${pick(names)} ${pad(i + a, 4)}`;
    accused.push([accused.length, i, selected, 19 + Math.floor(rand() * 38), rand() < 0.92 ? 1 : 2, `A${a + 1}`]);
    if (rand() < 0.42) arrests.push([arrests.length, i, 1, new Date(date.getTime() + (1 + Math.floor(rand() * 20)) * 86400000).toISOString().slice(0,10), 29, station.DistrictID, station.UnitID, 1000 + (i % 700), 500 + station.DistrictID, accused.length - 1, 1, 0]);
  }
  const victimCount = 1 + Math.floor(rand() * 3);
  for (let v = 0; v < victimCount; v++) victims.push([victims.length, i, `Victim ${pad(i,5)}-${v + 1}`, 14 + Math.floor(rand() * 62), rand() < 0.55 ? 2 : 1, 0]);
  if (rand() < 0.56) chargesheets.push([chargesheets.length, i, new Date(date.getTime() + (18 + Math.floor(rand() * 70)) * 86400000).toISOString(), rand() < 0.82 ? 'A' : 'C', 1000 + (i % 700)]);
}

[
  ['CaseMaster.csv', cases],
  ['Accused.csv', accused],
  ['Victim.csv', victims],
  ['ArrestSurrender.csv', arrests],
  ['ChargesheetDetails.csv', chargesheets],
].forEach(([file, rows]) => fs.writeFileSync(path.join(outDir, file), csv(rows)));

scenarios.push(
  { id: 'A', title: 'Festival Burglary Increase', outcome: 'Predict hotspot, repeat offender, and 3-unit patrol recommendation.', cases: ['Dasara', 'Burglary', 'Night-time MO'] },
  { id: 'B', title: 'Cyber Fraud Network', outcome: 'Graph reveals shared associates and transaction pattern.', cases: ['UPI Fraud', 'Investment Scam'] },
  { id: 'C', title: 'Narcotics Distribution', outcome: 'Gang evolution timeline shows NH corridor expansion.', cases: ['Drug Distribution', 'NH-167 Network'] },
  { id: 'D', title: 'Serial Offender', outcome: 'Crime DNA matches multiple FIRs with same MO.', cases: ['Vehicle Theft', 'Repeat offender'] },
  { id: 'E', title: 'Unexpected Anomaly', outcome: 'Isolation Forest flags rare timing/location/officer workload combination.', cases: ['Location anomaly', 'Officer workload'] },
);
fs.writeFileSync(path.join(outDir, 'scenario-library.json'), JSON.stringify({ count, seed, scenarios, gangs, repeatOffenders: repeatOffenders.slice(0, 200) }, null, 2));

console.log(`Generated ${count} FIR records in ${outDir}`);
