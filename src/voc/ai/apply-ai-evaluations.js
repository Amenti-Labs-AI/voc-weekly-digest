'use strict';

/**
 * @param {Array<object>} themes — aggregated themes
 * @param {{ evaluations?: Array<object> }} aiResult
 */
function applyAiEvaluations(themes, aiResult) {
  const byTheme = new Map((aiResult.evaluations || []).map((e) => [e.theme, e]));

  return themes.map((t) => {
    const ev = byTheme.get(t.theme);
    if (!ev) return { ...t };

    return {
      ...t,
      aiRecommendation: ev.recommendation,
      aiConfidence: ev.confidence,
      aiRationale: ev.rationale,
      aiCriteriaMet: ev.criteriaMet || [],
      aiCriteriaMissed: ev.criteriaMissed || [],
    };
  });
}

module.exports = { applyAiEvaluations };
