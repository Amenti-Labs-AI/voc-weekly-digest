'use strict';

/**
 * @typedef {object} ThemeEvent
 * @property {string} theme
 * @property {string} source
 * @property {string|null} sku
 * @property {number} mentions
 * @property {string} [snippet]
 * @property {number} erpWeight
 */

/**
 * @param {ThemeEvent[]} events
 */
function aggregateThemes(events) {
  /** @type {Map<string, { theme: string, sources: Set<string>, skus: Set<string>, mentions: number, snippets: string[], erpWeight: number }>} */
  const themeMap = new Map();

  for (const e of events) {
    if (!themeMap.has(e.theme)) {
      themeMap.set(e.theme, {
        theme: e.theme,
        sources: new Set(),
        skus: new Set(),
        mentions: 0,
        snippets: [],
        erpWeight: 0,
      });
    }
    const row = themeMap.get(e.theme);
    row.sources.add(e.source);
    if (e.sku) row.skus.add(e.sku);
    row.mentions += e.mentions;
    if (e.snippet) row.snippets.push(e.snippet);
    row.erpWeight += e.erpWeight;
  }

  return [...themeMap.values()].map((t) => ({
    theme: t.theme,
    corroborationScore: t.sources.size + t.erpWeight,
    sources: [...t.sources],
    skus: [...t.skus],
    mentions: t.mentions,
    snippets: t.snippets.slice(0, 2),
    erpWeight: t.erpWeight,
  }));
}

module.exports = { aggregateThemes };
