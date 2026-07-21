'use strict';

describe('ml lifecycle module', () => {
  test('exports continuous learning operations', () => {
    const lifecycle = require('./mlLifecycle');
    expect(typeof lifecycle.buildTrainingRows).toBe('function');
    expect(typeof lifecycle.trainCandidateModel).toBe('function');
    expect(typeof lifecycle.detectDrift).toBe('function');
    expect(typeof lifecycle.indexEmbeddings).toBe('function');
    expect(typeof lifecycle.vectorSearch).toBe('function');
  });
});
