'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildFeedEvalPrompt } = require('../src/voc/ai/feed-eval-prompt');
const { parseFeedAiEvaluation } = require('../src/voc/ai/parse-ai-response');
const { extractThemeEvents } = require('../src/voc/sources/source-fetcher');

describe('per-feed AI', () => {
  it('builds prompt with company criteria', () => {
    const prompt = buildFeedEvalPrompt(
      {
        clientName: 'Test Co',
        themeTaxonomy: ['packaging_damaged'],
        aiEvaluation: {
          instructions: 'Focus defects',
          criteria: [{ id: 'materiality', description: 'Must be material' }],
        },
      },
      { source: 'amazon_customer_feedback', topics: [] }
    );
    assert.match(prompt, /Test Co/);
    assert.match(prompt, /amazon_customer_feedback/);
    assert.match(prompt, /materiality/);
  });

  it('parses anthropic message content into feed evaluation', () => {
    const parsed = parseFeedAiEvaluation({
      content: [
        {
          type: 'text',
          text: '{"source":"dtc_review_app","themes":[{"theme":"pump_failure","mentions":1,"relevance":"high"}]}',
        },
      ],
    });
    assert.equal(parsed.source, 'dtc_review_app');
    assert.equal(parsed.themes[0].theme, 'pump_failure');
  });

  it('extracts events from aiFeedEvaluation on payload', () => {
    const events = extractThemeEvents(
      {
        dtc_review_app: {
          source: 'dtc_review_app',
          reviews: [],
          aiFeedEvaluation: {
            themes: [{ theme: 'pump_failure', mentions: 2, snippet: 'broken pump' }],
          },
        },
      },
      { returnReasonMap: {} }
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].theme, 'pump_failure');
    assert.equal(events[0].mentions, 2);
  });
});
