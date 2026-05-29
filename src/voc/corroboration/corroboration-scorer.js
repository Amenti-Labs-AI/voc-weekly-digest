'use strict';

/**
 * @param {ReturnType<import('./theme-aggregator').aggregateThemes>} themes
 * @param {{ minCorroborationScore?: number, minMentionsForActNow?: number }} thresholds
 */
function scoreThemes(themes, thresholds) {
  const minScore = thresholds.minCorroborationScore ?? 2;
  const minMentions = thresholds.minMentionsForActNow ?? 5;

  const sorted = [...themes].sort(
    (a, b) => b.corroborationScore - a.corroborationScore || b.mentions - a.mentions
  );

  const aiExcluded = (t) => t.aiRecommendation === 'exclude';
  const aiActNow = (t) => t.aiRecommendation === 'act_now';
  const aiWatch = (t) => t.aiRecommendation === 'watch';

  const actNow = sorted.filter(
    (t) =>
      !aiExcluded(t) &&
      t.corroborationScore >= minScore &&
      t.mentions >= minMentions &&
      (!t.aiRecommendation || aiActNow(t))
  );
  const watchList = sorted.filter(
    (t) =>
      !actNow.includes(t) &&
      !aiExcluded(t) &&
      (aiWatch(t) ||
        (t.corroborationScore >= 1 &&
          (t.corroborationScore < minScore || t.mentions < minMentions)))
  );

  return {
    themes: sorted,
    actionable: actNow.length > 0,
    actNow,
    watchList,
    thresholds: { minCorroborationScore: minScore, minMentionsForActNow: minMentions },
  };
}

module.exports = { scoreThemes };
