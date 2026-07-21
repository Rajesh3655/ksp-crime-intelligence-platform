'use strict';

const crypto = require('crypto');
const catalyst = require('catalyst-sdk');

const featureHash = (payload) =>
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

const cacheGet = async (key) => {
  try {
    return JSON.parse(await catalyst.cache().get(key));
  } catch {
    return null;
  }
};

const cachePut = async (key, value, ttlSeconds = 3600) => {
  try {
    await catalyst.cache().put(key, JSON.stringify(value), ttlSeconds);
  } catch {
    // Cache must never block intelligence computation.
  }
};

const storeFeatureVector = async ({ caseMasterId, vectorType, vector, sourceHash, metadata = {} }) => {
  try {
    await catalyst.datastore().table('AIFeatureStore').insertRow({
      CaseMasterID: caseMasterId,
      VectorType: vectorType,
      SourceHash: sourceHash,
      FeatureVector: vector,
      Metadata: metadata,
      CreatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[feature-store] insert failed:', error.message);
  }
};

module.exports = {
  cacheGet,
  cachePut,
  featureHash,
  storeFeatureVector,
};
