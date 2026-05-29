'use strict';

/**
 * @param {object} profile
 * @param {object} feed — VOC source payload (has `source`)
 */
function buildFeedEvalPrompt(profile, feed) {
  const criteria = profile.aiEvaluation?.criteria || [];
  const instructions = profile.aiEvaluation?.instructions || '';
  const taxonomy = profile.themeTaxonomy || [];

  return [
    'You evaluate a single VOC data feed before it is consolidated with other sources.',
    `Company: ${profile.clientName || 'Client'}`,
    instructions ? `Instructions: ${instructions}` : '',
    `Allowed themes (taxonomy): ${taxonomy.join(', ') || 'use snake_case labels'}`,
    'Criteria (apply when scoring each theme in this feed only):',
    ...criteria.map((c) => `- ${c.id}: ${c.description}`),
    '',
    `Feed source id: ${feed.source}`,
    'Feed JSON:',
    JSON.stringify(feed, null, 2),
    '',
    'Reply with ONLY valid JSON (no markdown):',
    '{"source":"<feed source id>","themes":[{"theme":"<taxonomy id>","mentions":<number>,"snippet":"<short quote>","relevance":"high|medium|low"}]}',
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = { buildFeedEvalPrompt };
