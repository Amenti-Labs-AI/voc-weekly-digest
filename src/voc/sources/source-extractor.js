'use strict';

/** @typedef {(payload: object, profile: object) => Array<import('../corroboration/theme-aggregator').ThemeEvent>} ThemeExtractor */

/**
 * @param {string} sourceId
 * @param {ThemeExtractor} extract
 */
function createExtractor(sourceId, extract) {
  return {
    sourceId,
    extract(payload, profile) {
      return extract(payload, profile);
    },
  };
}

module.exports = { createExtractor };
