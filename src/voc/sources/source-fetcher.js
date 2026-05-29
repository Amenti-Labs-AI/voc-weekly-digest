'use strict';

const { getExtractor } = require('./source-registry');
const { feedAiThemesToEvents } = require('../ai/feed-themes-to-events');

/**
 * @param {import('../config').HttpClient} http
 * @param {Array<{ id: string, url: string }>} sourceDefs
 */
async function fetchAllSources(http, sourceDefs) {
  /** @type {Record<string, object>} */
  const payloads = {};

  await Promise.all(
    sourceDefs.map(async ({ id, url }) => {
      payloads[id] = await http({ method: 'GET', url, json: true });
    })
  );

  return payloads;
}

/**
 * @param {Record<string, object>} payloads
 * @param {object} profile
 */
function extractThemeEvents(payloads, profile) {
  const events = [];
  for (const [sourceId, payload] of Object.entries(payloads)) {
    const aiThemes = payload.aiFeedEvaluation?.themes;
    if (Array.isArray(aiThemes) && aiThemes.length > 0) {
      events.push(...feedAiThemesToEvents(aiThemes, sourceId));
      continue;
    }
    const extractor = getExtractor(sourceId);
    events.push(...extractor.extract(payload, profile));
  }
  return events;
}

module.exports = { fetchAllSources, extractThemeEvents };
