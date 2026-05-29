'use strict';

const { createExtractor } = require('../source-extractor');

const marketplaceExtractor = createExtractor('marketplace_reviews', (payload) => {
  const events = [];
  for (const r of payload.reviews || []) {
    const theme = r.themeHint || (r.rating <= 2 ? 'packaging_damaged' : 'easy_to_use');
    events.push({
      theme,
      source: 'marketplace',
      sku: null,
      mentions: 1,
      snippet: r.text || r.title,
      erpWeight: 0,
    });
  }
  return events;
});

module.exports = { marketplaceExtractor };
