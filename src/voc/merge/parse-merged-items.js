'use strict';

/**
 * n8n HTTP nodes may leave JSON in `body` (string or object). Normalize to payload shape.
 * @param {object} json
 */
function unwrapItemJson(json) {
  if (!json || typeof json !== 'object') return json;
  if (json.clientName && json.thresholds) return json;
  if (json.source && json.aiFeedEvaluation) return json;
  if (json.source) return json;

  const body = json.body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return json;
    }
  }
  if (body && typeof body === 'object') return body;
  if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) return json.data;

  return json;
}

/**
 * @param {Array<{ json: object }>} items
 * @returns {{ profile: object | null, payloads: Record<string, object> }}
 */
function parseMergedItems(items) {
  let profile = null;
  /** @type {Record<string, object>} */
  const payloads = {};

  for (const item of items) {
    const json = unwrapItemJson(item.json);
    if (json.clientName && json.thresholds) profile = json;
    else if (json.source) payloads[json.source] = json;
  }

  return { profile, payloads };
}

module.exports = { unwrapItemJson, parseMergedItems };
