'use strict';

describe('intelligence engine module', () => {
  test('exports production intelligence functions', () => {
    const engine = require('./intelligenceEngine');
    expect(typeof engine.analyzeCase).toBe('function');
    expect(typeof engine.generateRepeatOffenderProfiles).toBe('function');
    expect(typeof engine.getCaseBundle).toBe('function');
  });
});
