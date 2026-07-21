'use strict';

describe('feature store helpers', () => {
  test('featureHash is stable for unchanged feature payloads', () => {
    const { featureHash } = require('./featureStore');
    const payload = { caseMasterId: 1, risk: [1, 2, 3] };
    expect(featureHash(payload)).toBe(featureHash(payload));
  });
});
