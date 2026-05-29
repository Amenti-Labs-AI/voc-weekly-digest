'use strict';

const { amazonExtractor } = require('./extractors/amazon');
const { dtcExtractor } = require('./extractors/dtc');
const { marketplaceExtractor } = require('./extractors/marketplace');
const { erpExtractor } = require('./extractors/erp');

/** @type {Map<string, import('./source-extractor').ThemeExtractor>} */
const registry = new Map([
  [amazonExtractor.sourceId, amazonExtractor],
  [dtcExtractor.sourceId, dtcExtractor],
  [marketplaceExtractor.sourceId, marketplaceExtractor],
  [erpExtractor.sourceId, erpExtractor],
]);

/**
 * @param {string} sourceId
 */
function getExtractor(sourceId) {
  const extractor = registry.get(sourceId);
  if (!extractor) {
    throw new Error(`No extractor registered for source: ${sourceId}`);
  }
  return extractor;
}

module.exports = { getExtractor, registry };
