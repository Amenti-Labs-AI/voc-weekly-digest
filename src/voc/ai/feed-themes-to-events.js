'use strict';

const SOURCE_EVENT_LABELS = {
  amazon_customer_feedback: 'amazon_feedback',
  dtc_review_app: 'dtc',
  marketplace_reviews: 'marketplace',
  erp_returns: 'erp_returns',
};

/**
 * @param {Array<object>} themes — from per-feed AI evaluation
 * @param {string} sourceId — payload.source
 */
function feedAiThemesToEvents(themes, sourceId) {
  const source = SOURCE_EVENT_LABELS[sourceId] || sourceId;
  const erpWeight = sourceId === 'erp_returns' ? 2 : 0;

  return themes.map((t) => ({
    theme: t.theme,
    source,
    sku: t.sku || null,
    mentions: t.mentions || 1,
    snippet: t.snippet,
    erpWeight,
    feedAiRelevance: t.relevance,
  }));
}

module.exports = { feedAiThemesToEvents, SOURCE_EVENT_LABELS };
