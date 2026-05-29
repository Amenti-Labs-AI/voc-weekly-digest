'use strict';

const POSITIVE_EXCEPTION_THEMES = new Set(['easy_to_use']);

/**
 * @param {object} profile
 * @returns {Array<{ id: string, description: string, weight: string }>}
 */
function getCriteria(profile) {
  const fromProfile = profile.aiEvaluation?.criteria;
  if (Array.isArray(fromProfile) && fromProfile.length) return fromProfile;

  return [
    {
      id: 'cross_source_corroboration',
      description: 'Theme appears in at least two independent signal types',
      weight: 'high',
    },
    {
      id: 'returns_alignment',
      description: 'ERP return reason codes align with the theme when returns data exists',
      weight: 'high',
    },
    {
      id: 'materiality',
      description: 'Enough customer mentions to be material for leadership this week',
      weight: 'medium',
    },
    {
      id: 'exception_focus',
      description: 'De-prioritize positive-only praise themes for an exception-only digest',
      weight: 'medium',
    },
  ];
}

/**
 * @param {object} profile
 * @returns {Set<string>}
 */
function themesLinkedToReturns(profile) {
  const linked = new Set();
  for (const themes of Object.values(profile.returnReasonMap || {})) {
    for (const t of themes) linked.add(t);
  }
  return linked;
}

/**
 * @param {object} theme — aggregated theme row
 * @param {object} profile
 */
function evaluateThemeWithCriteria(theme, profile) {
  const criteria = getCriteria(profile);
  const returnLinked = themesLinkedToReturns(profile);
  const criteriaMet = [];
  const criteriaMissed = [];

  for (const c of criteria) {
    switch (c.id) {
      case 'cross_source_corroboration':
        if (theme.sources.length >= 2) criteriaMet.push(c.id);
        else criteriaMissed.push(c.id);
        break;
      case 'returns_alignment':
        if (returnLinked.has(theme.theme) && theme.erpWeight >= 1) criteriaMet.push(c.id);
        else if (!returnLinked.has(theme.theme)) criteriaMet.push(c.id);
        else criteriaMissed.push(c.id);
        break;
      case 'materiality':
        if (theme.mentions >= 5) criteriaMet.push(c.id);
        else criteriaMissed.push(c.id);
        break;
      case 'exception_focus':
        if (POSITIVE_EXCEPTION_THEMES.has(theme.theme) && theme.sources.length <= 1) {
          criteriaMissed.push(c.id);
        } else criteriaMet.push(c.id);
        break;
      default:
        break;
    }
  }

  let recommendation = 'watch';
  let rationale;

  if (criteriaMissed.includes('exception_focus') && POSITIVE_EXCEPTION_THEMES.has(theme.theme)) {
    recommendation = 'exclude';
    rationale =
      'Positive sentiment theme; excluded from exception digest per company AI criteria.';
  } else if (
    criteriaMet.includes('cross_source_corroboration') &&
    criteriaMet.includes('returns_alignment') &&
    criteriaMet.includes('materiality')
  ) {
    recommendation = 'act_now';
    rationale = `Corroborated across ${theme.sources.length} sources with returns alignment and material mention volume.`;
  } else if (
    criteriaMet.includes('materiality') &&
    (criteriaMet.includes('cross_source_corroboration') || criteriaMet.includes('returns_alignment'))
  ) {
    recommendation = 'watch';
    rationale = `Material theme but missing full corroboration (${criteriaMissed.join(', ') || 'partial signals'}).`;
  } else {
    recommendation = 'exclude';
    rationale = `Does not meet company criteria for this digest (${criteriaMissed.join(', ') || 'weak signals'}).`;
  }

  const confidence =
    recommendation === 'act_now' ? 0.9 : recommendation === 'watch' ? 0.65 : 0.4;

  return {
    theme: theme.theme,
    recommendation,
    confidence,
    rationale,
    criteriaMet,
    criteriaMissed,
  };
}

/**
 * @param {object} profile
 * @param {Array<object>} themes
 */
function evaluateThemesWithCriteriaEngine(profile, themes) {
  const evaluations = themes.map((t) => evaluateThemeWithCriteria(t, profile));
  return {
    model: profile.aiEvaluation?.model || 'criteria-engine',
    evaluations,
  };
}

module.exports = {
  getCriteria,
  evaluateThemeWithCriteria,
  evaluateThemesWithCriteriaEngine,
};
