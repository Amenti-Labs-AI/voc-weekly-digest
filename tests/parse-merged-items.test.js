'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseMergedItems } = require('../src/voc/merge/parse-merged-items');
const { runVocFromMergedSources } = require('../src/voc/pipeline/voc-pipeline');

const profile = {
  clientName: 'Test',
  thresholds: { minCorroborationScore: 2, minMentionsForActNow: 5 },
  returnReasonMap: { DAMAGED: ['packaging_damaged'] },
};

describe('parseMergedItems', () => {
  it('finds profile when HTTP node wraps JSON in body string', () => {
    const { profile: p } = parseMergedItems([
      { json: { body: JSON.stringify(profile) } },
      { json: { source: 'amazon_customer_feedback', topics: [] } },
    ]);
    assert.equal(p.clientName, 'Test');
  });
});

describe('runVocFromMergedSources item count', () => {
  it('errors clearly when profile item missing', async () => {
    await assert.rejects(
      () =>
        runVocFromMergedSources([
          { json: { source: 'amazon_customer_feedback', topics: [] } },
        ]),
      /Missing client profile/
    );
  });
});
