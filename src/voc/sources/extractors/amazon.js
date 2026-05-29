'use strict';

const { createExtractor } = require('../source-extractor');

const amazonExtractor = createExtractor('amazon_customer_feedback', (payload) => {
  const events = [];
  for (const topic of payload.topics || []) {
    events.push({
      theme: topic.label,
      source: 'amazon_feedback',
      sku: null,
      mentions: topic.mentions || 1,
      snippet: topic.sampleSnippet,
      erpWeight: 0,
    });
  }
  return events;
});

module.exports = { amazonExtractor };
