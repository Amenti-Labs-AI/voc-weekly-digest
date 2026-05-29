'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { runVocPipeline, runVocFromMergedSources } = require('../src/voc/pipeline/voc-pipeline');

const profile = {
  clientName: 'Test Co',
  thresholds: { minCorroborationScore: 2, minMentionsForActNow: 5 },
  returnReasonMap: { DAMAGED: ['packaging_damaged'] },
  digest: { exceptionOnly: true },
  aiEvaluation: { enabled: true, provider: 'anthropic' },
};

describe('runVocPipeline', () => {
  it('produces normalized result from mocked HTTP', async () => {
    const responses = {
      '/mock/config/client-profile': profile,
      '/mock/amazon/feedback/topics': {
        source: 'amazon_customer_feedback',
        topics: [{ label: 'packaging_damaged', mentions: 20, sampleSnippet: 'crushed box' }],
      },
      '/mock/dtc/reviews': { source: 'dtc_review_app', reviews: [] },
      '/mock/marketplace/reviews': { source: 'marketplace_reviews', reviews: [] },
      '/mock/erp/returns': {
        source: 'erp_returns',
        summary: [{ sku: 'SKU-1', topReasons: [{ code: 'DAMAGED', count: 8, label: 'Damaged' }] }],
      },
    };

    const http = async ({ url }) => {
      if (!url.includes('client-profile')) {
        for (const [k, v] of Object.entries(responses)) {
          if (url.includes(k.replace(/^\//, '').split('?')[0])) return v;
        }
      }
      if (url.includes('client-profile')) return profile;
      throw new Error(`unexpected url ${url}`);
    };

    const result = await runVocPipeline({ http, wiremockBase: 'http://wiremock:8080' });
    assert.equal(result.profile.clientName, 'Test Co');
    assert.equal(typeof result.normalized.actionable, 'boolean');
    assert.ok(result.normalized.themes.length > 0);
    assert.equal(result.aiEvaluation.source, 'criteria-engine');
  });
});

describe('runVocFromMergedSources', () => {
  it('matches pipeline output when given merge-shaped items', async () => {
    const http = async ({ url }) => {
      const responses = {
        'client-profile': profile,
        'amazon/feedback': {
          source: 'amazon_customer_feedback',
          topics: [{ label: 'packaging_damaged', mentions: 20, sampleSnippet: 'crushed box' }],
        },
        'dtc/reviews': { source: 'dtc_review_app', reviews: [] },
        'marketplace/reviews': { source: 'marketplace_reviews', reviews: [] },
        'erp/returns': {
          source: 'erp_returns',
          summary: [{ sku: 'SKU-1', topReasons: [{ code: 'DAMAGED', count: 8, label: 'Damaged' }] }],
        },
      };
      for (const [k, v] of Object.entries(responses)) {
        if (url.includes(k)) return v;
      }
      throw new Error(`unexpected url ${url}`);
    };

    const fetched = await runVocPipeline({ http, wiremockBase: 'http://wiremock:8080' });
    const items = [
      { json: fetched.profile },
      { json: { source: 'amazon_customer_feedback', topics: [{ label: 'packaging_damaged', mentions: 20 }] } },
      { json: { source: 'dtc_review_app', reviews: [] } },
      { json: { source: 'marketplace_reviews', reviews: [] } },
      {
        json: {
          source: 'erp_returns',
          summary: [{ sku: 'SKU-1', topReasons: [{ code: 'DAMAGED', count: 8 }] }],
        },
      },
    ];
    const merged = await runVocFromMergedSources(items);
    assert.equal(merged.normalized.actionable, fetched.normalized.actionable);
    assert.equal(merged.normalized.themes.length, fetched.normalized.themes.length);
    assert.ok(merged.aiEvaluation);
  });
});
