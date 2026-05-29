'use strict';

const { createExtractor } = require('../source-extractor');

const erpExtractor = createExtractor('erp_returns', (payload, profile) => {
  const returnReasonMap = profile.returnReasonMap || {};
  const events = [];
  for (const row of payload.summary || []) {
    for (const reason of row.topReasons || []) {
      const themes = returnReasonMap[reason.code] || ['not_as_described'];
      for (const theme of themes) {
        events.push({
          theme,
          source: 'erp_returns',
          sku: row.sku,
          mentions: reason.count,
          snippet: reason.label,
          erpWeight: 2,
        });
      }
    }
  }
  return events;
});

module.exports = { erpExtractor };
