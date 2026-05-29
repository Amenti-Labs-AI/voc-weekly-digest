'use strict';

const { createExtractor } = require('../source-extractor');

const dtcExtractor = createExtractor('dtc_review_app', (payload) => {
  const events = [];
  for (const r of payload.reviews || []) {
    const theme = r.themeHint || (r.rating <= 2 ? 'not_as_described' : 'easy_to_use');
    events.push({
      theme,
      source: 'dtc',
      sku: r.sku,
      mentions: 1,
      snippet: r.body || r.title,
      erpWeight: 0,
    });
  }
  return events;
});

module.exports = { dtcExtractor };
