'use strict';

const crypto = require('crypto');
const catalyst = require('catalyst-sdk');
const { callAiService } = require('./aiServiceClient');
const { featureHash, cachePut } = require('./featureStore');

const readRows = async (table, query) => {
  try {
    return await catalyst.datastore().table(table).query(query);
  } catch (error) {
    console.error(`[ml-lifecycle] query failed for ${table}:`, error.message);
    return [];
  }
};

const extract = (row, table) => row?.[table] || row || {};

const buildTrainingRows = async (limit = 5000) => {
  const rows = await readRows('CaseMaster',
    `SELECT cm.CaseMasterID, cm.latitude, cm.longitude, cm.CrimeMajorHeadID, cm.CrimeMinorHeadID,
            cm.PoliceStationID, cm.CrimeRegisteredDate, cm.IncidentFromDate, cm.IncidentToDate,
            cm.BriefFacts, u.DistrictID,
            COUNT(DISTINCT a.AccusedMasterID) AS accused_count,
            COUNT(DISTINCT v.VictimMasterID) AS victim_count,
            COUNT(DISTINCT asa.SectionID) AS section_count
     FROM CaseMaster cm
     LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
     LEFT JOIN Accused a ON cm.CaseMasterID = a.CaseMasterID
     LEFT JOIN Victim v ON cm.CaseMasterID = v.CaseMasterID
     LEFT JOIN ActSectionAssociation asa ON cm.CaseMasterID = asa.CaseMasterID
     GROUP BY cm.CaseMasterID
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
      accusedCount: Number(row.accused_count || row['COUNT(DISTINCT a.AccusedMasterID)'] || 0),
      victimCount: Number(row.victim_count || row['COUNT(DISTINCT v.VictimMasterID)'] || 0),
      actSectionCount: Number(row.section_count || row['COUNT(DISTINCT asa.SectionID)'] || 0),
      repeatSignals: 0,
    };
  });
};

const persistDataset = async (rows, builtBy = 'system') => {
  const sourceHash = featureHash(rows);
  const datasetVersion = `ds-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${sourceHash.slice(0, 8)}`;
  const cacheKey = `ciap:dataset:${datasetVersion}`;
  await cachePut(cacheKey, rows, 86400);

  let stratusObjectKey = null;
  try {
    const folder = await catalyst.stratus().getFolder('ml-datasets');
    const file = await folder.uploadFile({
      code: datasetVersion,
      name: `${datasetVersion}.json`,
      content: Buffer.from(JSON.stringify(rows)),
      mimeType: 'application/json',
    });
    stratusObjectKey = file.file_location;
  } catch (error) {
    console.error('[ml-lifecycle] Stratus dataset upload failed:', error.message);
  }

  await catalyst.datastore().table('MLTrainingDataset').insertRow({
    DatasetVersion: datasetVersion,
    SourceHash: sourceHash,
    SourceTables: ['CaseMaster', 'Victim', 'Accused', 'ComplainantDetails', 'ArrestSurrender', 'CrimeHead', 'CrimeSubHead', 'District', 'Unit', 'Employee', 'ChargesheetDetails', 'Act', 'Section'],
    RowCount: rows.length,
    FeatureCount: 12,
    StratusObjectKey: stratusObjectKey,
    Status: 'ready',
    BuiltAt: new Date().toISOString(),
    BuiltBy: builtBy,
  }).catch(error => console.error('[ml-lifecycle] dataset registry insert failed:', error.message));

  return { datasetVersion, sourceHash, rows, stratusObjectKey };
};

const registerModel = async (record) => {
  const table = catalyst.datastore().table('MLModelRegistry');
  const payload = {
    ModelID: record.modelId,
    Version: record.version,
    TrainingDate: record.trainingDate,
    Algorithm: record.algorithm,
    Hyperparameters: record.hyperparameters || {},
    Accuracy: record.metrics?.accuracy || null,
    PrecisionScore: record.metrics?.precision || null,
    RecallScore: record.metrics?.recall || null,
    F1Score: record.metrics?.f1 || null,
    AUCScore: record.metrics?.auc || null,
    TrainingDatasetVersion: record.trainingDatasetVersion,
    DeploymentStatus: record.deploymentStatus || 'shadow',
    ApprovalStatus: record.approvalStatus || 'pending',
    ArtifactPath: record.artifactPath,
    SupportedTasks: record.supportedTasks || [],
    CreatedAt: new Date().toISOString(),
  };
  await table.insertRow(payload).catch(error => console.error('[ml-lifecycle] model registry insert failed:', error.message));
  return payload;
};

const trainCandidateModel = async ({ target = 'risk', limit = 5000, builtBy = 'system' }) => {
  const rows = await buildTrainingRows(limit);
  const dataset = await persistDataset(rows, builtBy);
  const aiResult = await callAiService('/train', {
    datasetVersion: dataset.datasetVersion,
    rows,
    target,
    approvedBy: builtBy,
  }, 120000);
  if (!aiResult?.registryRecord) return { dataset, model: null, status: 'queued_without_ai_service' };
  const model = await registerModel(aiResult.registryRecord);
  await persistArtifactManifest(aiResult.registryRecord);
  return { dataset, model, status: 'trained' };
};

const persistArtifactManifest = async (record) => {
  try {
    await catalyst.nosql().collection('ModelArtifactManifest').insert({
      manifest_id: `${record.modelId}:${record.version}`,
      model_id: record.modelId,
      version: record.version,
      artifact_paths: {
        model: record.artifactPath,
        scaler: record.artifactPath?.replace('artifact.joblib', 'scaler.joblib'),
        encoders: record.artifactPath?.replace('artifact.joblib', 'encoders.json'),
        metadata: record.artifactPath?.replace('artifact.joblib', 'metadata.json'),
      },
      metadata: record,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ml-lifecycle] artifact manifest failed:', error.message);
  }
};

const detectDrift = async ({ limit = 1000 } = {}) => {
  const rows = await buildTrainingRows(limit);
  const datasetVersion = `drift-${Date.now()}`;
  const result = await callAiService('/drift', { datasetVersion, rows, target: 'risk' }) || { driftDetected: false, events: [] };
  for (const event of result.events || []) {
    await catalyst.datastore().table('MLDriftEvent').insertRow({
      ModelID: 'ciap-risk-ensemble',
      ModelVersion: 'production',
      DriftType: event.type,
      DriftScore: event.score,
      Threshold: event.threshold,
      Status: 'detected',
      Evidence: event,
      CreatedAt: new Date().toISOString(),
    }).catch(error => console.error('[ml-lifecycle] drift insert failed:', error.message));
  }
  return result;
};

const semanticVector = (text) => {
  const tokens = String(text || '').toLowerCase().split(/\W+/).filter(Boolean);
  const bins = Array.from({ length: 32 }, () => 0);
  for (const token of tokens) {
    const index = parseInt(crypto.createHash('sha1').update(token).digest('hex').slice(0, 4), 16) % bins.length;
    bins[index] += 1;
  }
  const norm = Math.sqrt(bins.reduce((sum, value) => sum + value * value, 0)) || 1;
  return bins.map(value => Number((value / norm).toFixed(6)));
};

const cosine = (a, b) => {
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] || 0), 0);
  const an = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0)) || 1;
  const bn = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0)) || 1;
  return dot / (an * bn);
};

const indexEmbeddings = async (limit = 2000) => {
  const rows = await buildTrainingRows(limit);
  const coll = catalyst.nosql().collection('EmbeddingStore');
  let indexed = 0;
  for (const row of rows) {
    const sourceHash = featureHash(row.description);
    const document = {
      embedding_id: `brief-${row.caseMasterId}-${sourceHash.slice(0, 8)}`,
      case_master_id: row.caseMasterId,
      source_type: 'brief_facts',
      source_hash: sourceHash,
      vector: semanticVector(row.description),
      model_id: 'ciap-semantic-hash',
      model_version: 'v1',
      created_at: new Date().toISOString(),
    };
    await coll.insert(document).catch(() => {});
    indexed++;
  }
  return { indexed };
};

const vectorSearch = async (query, limit = 10) => {
  const queryVector = semanticVector(query);
  const docs = await catalyst.nosql().collection('EmbeddingStore').query({}).catch(() => []);
  return docs
    .map(doc => ({ ...doc, similarity: cosine(queryVector, doc.vector || []) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};

module.exports = {
  buildTrainingRows,
  persistDataset,
  trainCandidateModel,
  registerModel,
  detectDrift,
  indexEmbeddings,
  vectorSearch,
};
