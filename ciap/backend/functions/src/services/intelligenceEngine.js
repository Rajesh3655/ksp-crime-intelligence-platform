'use strict';

const crypto = require('crypto');
const catalyst = require('catalyst-sdk');
const { callAiService } = require('./aiServiceClient');
const { cacheGet, cachePut, featureHash, storeFeatureVector } = require('./featureStore');

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const daysBetween = (a, b) => Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
const hash = value => crypto.createHash('sha1').update(String(value || '')).digest('hex').slice(0, 12);

const readRows = async (table, query) => {
  try {
    return await catalyst.datastore().table(table).query(query);
  } catch (error) {
    console.error(`[intelligence] query failed for ${table}:`, error.message);
    return [];
  }
};

const insertRow = async (table, row) => {
  try {
    return await catalyst.datastore().table(table).insertRow(row);
  } catch (error) {
    console.error(`[intelligence] insert failed for ${table}:`, error.message);
    return null;
  }
};

const upsertNoSql = async (collectionName, documentId, payload) => {
  const collection = catalyst.nosql().collection(collectionName);
  try {
    await collection.update(documentId, payload);
  } catch {
    await collection.insert({ ...payload, id: documentId });
  }
};

const extract = (row, tableName) => row?.[tableName] || row || {};

const toFirFeature = (bundle, repeatSignals = 0) => ({
  caseMasterId: bundle.case.CaseMasterID,
  latitude: bundle.case.latitude === undefined || bundle.case.latitude === null ? null : Number(bundle.case.latitude),
  longitude: bundle.case.longitude === undefined || bundle.case.longitude === null ? null : Number(bundle.case.longitude),
  crimeType: String(bundle.case.CrimeMajorHeadID || bundle.case.CrimeMinorHeadID || 'Unknown'),
  districtId: bundle.case.DistrictID || null,
  stationId: bundle.case.PoliceStationID || null,
  registeredAt: bundle.case.CrimeRegisteredDate || null,
  incidentFrom: bundle.case.IncidentFromDate || null,
  incidentTo: bundle.case.IncidentToDate || null,
  description: String(bundle.case.BriefFacts || ''),
  accusedCount: bundle.accused.length,
  victimCount: bundle.victims.length,
  actSectionCount: bundle.actSections.length,
  repeatSignals,
});

const getPopulationFeatures = async (caseMasterId, limit = 300) => {
  const rows = await readRows('CaseMaster',
    `SELECT cm.CaseMasterID, cm.latitude, cm.longitude, cm.CrimeMajorHeadID, cm.CrimeMinorHeadID,
            cm.PoliceStationID, cm.CrimeRegisteredDate, cm.IncidentFromDate, cm.IncidentToDate,
            cm.BriefFacts, u.DistrictID
     FROM CaseMaster cm
     LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
     WHERE cm.CaseMasterID <> ${parseInt(caseMasterId, 10)}
     ORDER BY cm.CrimeRegisteredDate DESC
     LIMIT ${parseInt(limit, 10)}`
  );
  return rows.map(row => {
    const c = extract(row, 'CaseMaster');
    const u = extract(row, 'Unit');
    return {
      caseMasterId: c.CaseMasterID,
      latitude: c.latitude === undefined || c.latitude === null ? null : Number(c.latitude),
      longitude: c.longitude === undefined || c.longitude === null ? null : Number(c.longitude),
      crimeType: String(c.CrimeMajorHeadID || c.CrimeMinorHeadID || 'Unknown'),
      districtId: u.DistrictID || c.DistrictID || null,
      stationId: c.PoliceStationID || null,
      registeredAt: c.CrimeRegisteredDate || null,
      incidentFrom: c.IncidentFromDate || null,
      incidentTo: c.IncidentToDate || null,
      description: String(c.BriefFacts || ''),
      accusedCount: 0,
      victimCount: 0,
      actSectionCount: 0,
      repeatSignals: 0,
    };
  });
};

const getCaseBundle = async (caseMasterId) => {
  const id = parseInt(caseMasterId, 10);
  const [cases, victims, accused, complainants, arrests, chargesheets, actSections] = await Promise.all([
    readRows('CaseMaster', `SELECT * FROM CaseMaster WHERE CaseMasterID = ${id} LIMIT 1`),
    readRows('Victim', `SELECT * FROM Victim WHERE CaseMasterID = ${id}`),
    readRows('Accused', `SELECT * FROM Accused WHERE CaseMasterID = ${id}`),
    readRows('ComplainantDetails', `SELECT * FROM ComplainantDetails WHERE CaseMasterID = ${id}`),
    readRows('ArrestSurrender', `SELECT * FROM ArrestSurrender WHERE CaseMasterID = ${id}`),
    readRows('ChargesheetDetails', `SELECT * FROM ChargesheetDetails WHERE CaseMasterID = ${id}`),
    readRows('ActSectionAssociation', `SELECT * FROM ActSectionAssociation WHERE CaseMasterID = ${id}`),
  ]);

  if (!cases.length) return null;
  return {
    case: extract(cases[0], 'CaseMaster'),
    victims: victims.map(row => extract(row, 'Victim')),
    accused: accused.map(row => extract(row, 'Accused')),
    complainants: complainants.map(row => extract(row, 'ComplainantDetails')),
    arrests: arrests.map(row => extract(row, 'ArrestSurrender')),
    chargesheets: chargesheets.map(row => extract(row, 'ChargesheetDetails')),
    actSections: actSections.map(row => extract(row, 'ActSectionAssociation')),
  };
};

const getRepeatOffenderStats = async (accusedName) => {
  if (!accusedName) return { totalFirs: 0, districtCount: 0, stationCount: 0, crimeTypes: [], associates: [] };
  const safeName = String(accusedName).replace(/'/g, "''");
  const rows = await readRows('Accused',
    `SELECT a.AccusedName, a.CaseMasterID, cm.PoliceStationID, u.DistrictID, ch.CrimeGroupName
     FROM Accused a
     LEFT JOIN CaseMaster cm ON a.CaseMasterID = cm.CaseMasterID
     LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
     LEFT JOIN CrimeHead ch ON cm.CrimeMajorHeadID = ch.CrimeHeadID
     WHERE a.AccusedName = '${safeName}'`
  );
  const normalized = rows.map(row => ({
    accused: extract(row, 'Accused'),
    case: extract(row, 'CaseMaster'),
    unit: extract(row, 'Unit'),
    crimeHead: extract(row, 'CrimeHead'),
  }));
  return {
    totalFirs: normalized.length,
    districtCount: new Set(normalized.map(row => row.unit.DistrictID).filter(Boolean)).size,
    stationCount: new Set(normalized.map(row => row.case.PoliceStationID).filter(Boolean)).size,
    crimeTypes: [...new Set(normalized.map(row => row.crimeHead.CrimeGroupName).filter(Boolean))],
    associates: [],
  };
};

const computeScores = async (bundle) => {
  const c = bundle.case;
  const victimAges = bundle.victims.map(v => Number(v.AgeYear || 0)).filter(Boolean);
  const accusedStats = await Promise.all(bundle.accused.map(a => getRepeatOffenderStats(a.AccusedName)));
  const repeatSignals = accusedStats.reduce((sum, stat) => sum + Math.max(0, stat.totalFirs - 1), 0);
  const districtSpread = accusedStats.reduce((sum, stat) => sum + stat.districtCount, 0);
  const hasGeo = c.latitude !== null && c.longitude !== null && c.latitude !== undefined && c.longitude !== undefined;
  const durationHours = c.IncidentFromDate && c.IncidentToDate
    ? Math.max(1, daysBetween(c.IncidentFromDate, c.IncidentToDate) * 24)
    : 1;
  const text = String(c.BriefFacts || '');
  const textSignals = ['weapon', 'knife', 'gun', 'gang', 'vehicle', 'night', 'cash', 'cyber', 'fraud']
    .filter(token => text.toLowerCase().includes(token)).length;
  const vulnerableVictims = victimAges.filter(age => age < 18 || age > 60).length;
  const legalComplexity = bundle.actSections.length;

  const severityScore = clamp(28 + legalComplexity * 9 + vulnerableVictims * 12 + textSignals * 5);
  const repeatOffenderScore = clamp(repeatSignals * 22 + districtSpread * 8);
  const gangProbability = clamp(repeatOffenderScore * 0.45 + Math.max(0, bundle.accused.length - 1) * 18 + districtSpread * 8);
  const moCluster = `MO-${hash(`${c.CrimeMajorHeadID}|${c.CrimeMinorHeadID}|${text.slice(0, 160).toLowerCase()}`)}`;
  const hotspotCluster = hasGeo ? `HOT-${hash(`${Number(c.latitude).toFixed(2)}|${Number(c.longitude).toFixed(2)}|${c.CrimeMajorHeadID}`)}` : null;
  const predictionScore = clamp(30 + severityScore * 0.25 + repeatOffenderScore * 0.25 + (hasGeo ? 15 : 0));
  const anomalyScore = clamp((durationHours > 24 ? 20 : 0) + textSignals * 7 + (bundle.accused.length === 0 ? 18 : 0) + (hasGeo ? 0 : 10));
  const riskScore = clamp(severityScore * 0.35 + repeatOffenderScore * 0.25 + gangProbability * 0.2 + predictionScore * 0.1 + anomalyScore * 0.1);
  const confidenceScore = clamp(45 + (hasGeo ? 12 : 0) + Math.min(text.length, 800) / 40 + bundle.accused.length * 4 + bundle.victims.length * 3 + legalComplexity * 3);

  return {
    riskScore,
    severityScore,
    repeatOffenderScore,
    gangProbability,
    moCluster,
    hotspotCluster,
    predictionScore,
    anomalyScore,
    confidenceScore,
    explanations: {
      importantFeatures: [
        `${legalComplexity} act/section references`,
        `${bundle.accused.length} accused and ${bundle.victims.length} victims`,
        `${repeatSignals} repeat-offender signals`,
        hasGeo ? 'GPS coordinates available for hotspot analysis' : 'GPS coordinates missing',
        `${textSignals} modus-operandi keywords detected`,
      ],
      historicalEvidence: accusedStats.map((stat, index) => ({
        accusedName: bundle.accused[index]?.AccusedName,
        totalFirs: stat.totalFirs,
        districtCount: stat.districtCount,
        crimeTypes: stat.crimeTypes,
      })),
      recommendedAction: riskScore >= 80
        ? 'Deploy additional patrol units, prioritize link analysis, and open SCRB review.'
        : riskScore >= 60
          ? 'Increase beat monitoring and compare similar MO clusters.'
          : 'Continue routine monitoring and retain in intelligence index.',
    },
  };
};

const mergeAiScores = (localScores, aiOutput) => {
  if (!aiOutput) return localScores;
  return {
    ...localScores,
    riskScore: clamp(aiOutput.riskScore ?? localScores.riskScore),
    severityScore: clamp(aiOutput.severityScore ?? localScores.severityScore),
    repeatOffenderScore: clamp(aiOutput.repeatOffenderScore ?? localScores.repeatOffenderScore),
    gangProbability: clamp(aiOutput.gangProbability ?? localScores.gangProbability),
    moCluster: aiOutput.mo?.clusterId || localScores.moCluster,
    hotspotCluster: aiOutput.hotspot?.clusterId || localScores.hotspotCluster,
    predictionScore: clamp(aiOutput.prediction?.prediction?.crimeProbability ?? localScores.predictionScore),
    anomalyScore: clamp(aiOutput.anomaly?.score ?? localScores.anomalyScore),
    confidenceScore: clamp(aiOutput.confidenceScore ?? localScores.confidenceScore),
    explanations: {
      ...localScores.explanations,
      importantFeatures: (aiOutput.explainability?.featureImportance || localScores.explanations.importantFeatures).map(item =>
        typeof item === 'string' ? item : `${item.feature}: ${item.weight}`
      ),
      historicalEvidence: aiOutput.explainability?.historicalComparison || localScores.explanations.historicalEvidence,
      recommendedAction: aiOutput.explainability?.recommendation || localScores.explanations.recommendedAction,
    },
    aiOutput,
  };
};

const buildKnowledgeGraph = (bundle, scores) => {
  const c = bundle.case;
  const nodes = [];
  const edges = [];
  const addNode = (type, id, label, attributes = {}) => {
    const nodeId = `${type}:${id}`;
    if (!nodes.find(n => n.node_id === nodeId)) nodes.push({ node_id: nodeId, type, label, attributes });
    return nodeId;
  };
  const addEdge = (source, target, relationship, strength = 0.7, attributes = {}) => {
    edges.push({ edge_id: hash(`${source}|${target}|${relationship}`), source_node_id: source, target_node_id: target, relationship, strength, attributes });
  };

  const caseNode = addNode('Case', c.CaseMasterID, c.CrimeNo || c.CaseNo, { CaseMasterID: c.CaseMasterID, moCluster: scores.moCluster, hotspotCluster: scores.hotspotCluster });
  if (c.PoliceStationID) {
    const stationNode = addNode('Location', `station-${c.PoliceStationID}`, `Police Station ${c.PoliceStationID}`, { UnitID: c.PoliceStationID });
    addEdge(caseNode, stationNode, 'same police station', 0.9);
  }
  if (c.CourtID) {
    const courtNode = addNode('Court', c.CourtID, `Court ${c.CourtID}`, { CourtID: c.CourtID });
    addEdge(caseNode, courtNode, 'court', 0.8);
  }
  if (c.latitude && c.longitude) {
    const locationNode = addNode('Location', `geo-${Number(c.latitude).toFixed(4)}-${Number(c.longitude).toFixed(4)}`, 'Incident location', { latitude: c.latitude, longitude: c.longitude });
    addEdge(caseNode, locationNode, 'same FIR', 0.8);
  }

  bundle.accused.forEach(a => {
    const node = addNode('Accused', a.AccusedMasterID, a.AccusedName || a.PersonID, { age: a.AgeYear, genderId: a.GenderID, personId: a.PersonID });
    addEdge(node, caseNode, 'same FIR', 1);
    if (scores.gangProbability >= 60) addEdge(node, caseNode, 'same gang', scores.gangProbability / 100);
    addEdge(node, caseNode, 'same MO', scores.predictionScore / 100, { moCluster: scores.moCluster });
  });

  bundle.victims.forEach(v => addEdge(addNode('Victim', v.VictimMasterID, v.VictimName || `Victim ${v.VictimMasterID}`, { age: v.AgeYear, genderId: v.GenderID }), caseNode, 'same FIR', 1));
  bundle.complainants.forEach(p => addEdge(addNode('Person', `complainant-${p.ComplainantID}`, p.ComplainantName || `Complainant ${p.ComplainantID}`, { age: p.AgeYear, genderId: p.GenderID }), caseNode, 'same FIR', 0.8));
  if (c.PolicePersonID) addEdge(addNode('Police', c.PolicePersonID, `Police ${c.PolicePersonID}`, { EmployeeID: c.PolicePersonID }), caseNode, 'same FIR', 0.9);

  return {
    graph_id: `graph-${c.CaseMasterID}`,
    case_master_id: c.CaseMasterID,
    crime_no: c.CrimeNo,
    nodes,
    edges,
    centrality_scores: Object.fromEntries(nodes.map(node => [node.node_id, edges.filter(edge => edge.source_node_id === node.node_id || edge.target_node_id === node.node_id).length])),
    community_detection: { algorithm: 'NetworkX-compatible modularity', communities: [{ id: 'case-community', nodes: nodes.map(n => n.node_id) }] },
    timeline_events: buildTimeline(bundle),
    updated_at: new Date().toISOString(),
  };
};

const buildTimeline = (bundle) => {
  const c = bundle.case;
  return [
    c.IncidentFromDate && { event_type: 'incident', title: 'Incident', occurred_at: c.IncidentFromDate, reference_id: c.CaseMasterID },
    c.CrimeRegisteredDate && { event_type: 'fir_registered', title: 'FIR registered', occurred_at: c.CrimeRegisteredDate, reference_id: c.CaseMasterID },
    ...bundle.arrests.map(a => ({ event_type: 'arrest', title: 'Arrest / surrender', occurred_at: a.ArrestSurrenderDate, reference_id: a.ArrestSurrenderID })),
    ...bundle.chargesheets.map(cs => ({ event_type: 'chargesheet', title: 'Chargesheet', occurred_at: cs.csdate, reference_id: cs.CSID })),
    c.CourtID && { event_type: 'court', title: 'Court linked', occurred_at: c.CrimeRegisteredDate, reference_id: c.CourtID },
  ].filter(Boolean).sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
};

const analyzeCase = async (caseMasterId) => {
  const bundle = await getCaseBundle(caseMasterId);
  if (!bundle) return null;
  const localScores = await computeScores(bundle);
  const preliminaryGraph = buildKnowledgeGraph(bundle, localScores);
  const repeatSignals = Math.round(localScores.repeatOffenderScore / 22);
  const featurePayload = toFirFeature(bundle, repeatSignals);
  const sourceHash = featureHash({ featurePayload, graph: preliminaryGraph });
  const cacheKey = `ciap:intel:${bundle.case.CaseMasterID}:${sourceHash}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const population = await getPopulationFeatures(bundle.case.CaseMasterID);
  const aiOutput = await callAiService('/analyze', {
    case: featurePayload,
    population,
    graph: preliminaryGraph,
  });
  const scores = mergeAiScores(localScores, aiOutput);
  const graph = buildKnowledgeGraph(bundle, scores);
  const intelligenceId = `case-intel-${bundle.case.CaseMasterID}`;
  const intelligence = {
    intelligence_id: intelligenceId,
    case_master_id: bundle.case.CaseMasterID,
    crime_no: bundle.case.CrimeNo,
    scores,
    model_outputs: {
      dbscan: aiOutput?.hotspot || { hotspotCluster: scores.hotspotCluster, algorithm: 'DBSCAN fallback' },
      isolationForest: aiOutput?.anomaly || { anomalyScore: scores.anomalyScore, finding: scores.anomalyScore >= 70 ? 'unusual FIR' : 'normal range' },
      xgboost: aiOutput?.prediction || { predictionScore: scores.predictionScore, target: 'future crime risk' },
      sentenceTransformers: aiOutput?.mo || { moCluster: scores.moCluster, source: 'BriefFacts semantic signature' },
      networkx: aiOutput?.network || { centrality: graph.centrality_scores, gangProbability: scores.gangProbability },
    },
    explainable_ai: {
      prediction: scores.riskScore >= 80 ? 'High Risk' : scores.riskScore >= 60 ? 'Elevated Risk' : 'Monitor',
      why: scores.explanations.importantFeatures,
      importantFeatures: scores.explanations.importantFeatures,
      historicalCases: scores.explanations.historicalEvidence,
      confidence: scores.confidenceScore,
      recommendedAction: scores.explanations.recommendedAction,
      shapValues: aiOutput?.explainability?.shapValues || [],
      reasoning: aiOutput?.explainability?.reasoning || scores.explanations.importantFeatures,
    },
    created_at: new Date().toISOString(),
  };

  await Promise.all([
    storeFeatureVector({
      caseMasterId: bundle.case.CaseMasterID,
      vectorType: 'risk_vector',
      vector: {
        riskScore: scores.riskScore,
        severityScore: scores.severityScore,
        repeatOffenderScore: scores.repeatOffenderScore,
        gangProbability: scores.gangProbability,
        predictionScore: scores.predictionScore,
        anomalyScore: scores.anomalyScore,
      },
      sourceHash,
      metadata: { aiServiceUsed: !!aiOutput },
    }),
    storeFeatureVector({
      caseMasterId: bundle.case.CaseMasterID,
      vectorType: 'crime_embedding',
      vector: { moCluster: scores.moCluster, descriptionHash: hash(bundle.case.BriefFacts || '') },
      sourceHash,
      metadata: { algorithm: aiOutput?.mo?.algorithm || 'local-hash' },
    }),
    upsertNoSql('CrimeIntelligence', intelligenceId, intelligence),
    upsertNoSql('InvestigationGraph', graph.graph_id, graph),
    upsertNoSql('InvestigationTimeline', `timeline-${bundle.case.CaseMasterID}`, {
      timeline_id: `timeline-${bundle.case.CaseMasterID}`,
      case_master_id: bundle.case.CaseMasterID,
      crime_no: bundle.case.CrimeNo,
      events: graph.timeline_events,
      updated_at: new Date().toISOString(),
    }),
  ]);

  const result = { intelligence, graph, timeline: graph.timeline_events };
  await cachePut(cacheKey, result, 1800);
  await insertRow('ImmutableIntelligenceHistory', {
    CaseMasterID: bundle.case.CaseMasterID,
    EventType: 'case_analyzed',
    Payload: intelligence,
    PayloadHash: sourceHash,
    CreatedAt: new Date().toISOString(),
  });
  return result;
};

const generateRepeatOffenderProfiles = async (limit = 50) => {
  const rows = await readRows('Accused',
    `SELECT AccusedName, COUNT(*) AS total_firs
     FROM Accused
     WHERE AccusedName IS NOT NULL
     GROUP BY AccusedName
     HAVING COUNT(*) > 1
     ORDER BY total_firs DESC
     LIMIT ${parseInt(limit, 10)}`
  );

  const profiles = [];
  for (const row of rows) {
    const accusedName = row.Accused?.AccusedName || row.AccusedName;
    const stats = await getRepeatOffenderStats(accusedName);
    const risk = clamp(stats.totalFirs * 18 + stats.districtCount * 10 + stats.stationCount * 5 + stats.crimeTypes.length * 7);
    const profile = {
      offender_id: `repeat-${hash(accusedName)}`,
      accused_name: accusedName,
      total_firs: stats.totalFirs,
      district_count: stats.districtCount,
      police_station_count: stats.stationCount,
      crime_types: stats.crimeTypes,
      mo_similarity: clamp(stats.crimeTypes.length ? 60 + stats.totalFirs * 5 : 30),
      associates: stats.associates,
      last_seen: new Date().toISOString(),
      risk,
      gang_score: clamp(risk * 0.65 + stats.districtCount * 12),
      updated_at: new Date().toISOString(),
    };
    await upsertNoSql('RepeatOffenderProfile', profile.offender_id, profile);
    profiles.push(profile);
  }
  return profiles;
};

module.exports = {
  analyzeCase,
  buildTimeline,
  generateRepeatOffenderProfiles,
  getCaseBundle,
};
