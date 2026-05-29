'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { scoreThemes } = require('../src/voc/corroboration/corroboration-scorer');

describe('scoreThemes', () => {
  it('marks actionable when score and mentions meet threshold', () => {
    const themes = [
      { theme: 'packaging_damaged', corroborationScore: 3, sources: ['a', 'b'], skus: [], mentions: 10, snippets: [] },
    ];
    const result = scoreThemes(themes, { minCorroborationScore: 2, minMentionsForActNow: 5 });
    assert.equal(result.actionable, true);
    assert.equal(result.actNow.length, 1);
  });

  it('is not actionable when below thresholds', () => {
    const themes = [
      { theme: 'easy_to_use', corroborationScore: 1, sources: ['a'], skus: [], mentions: 2, snippets: [] },
    ];
    const result = scoreThemes(themes, { minCorroborationScore: 2, minMentionsForActNow: 5 });
    assert.equal(result.actionable, false);
    assert.equal(result.actNow.length, 0);
  });
});
