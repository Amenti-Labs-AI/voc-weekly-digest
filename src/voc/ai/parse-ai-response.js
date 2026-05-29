'use strict';

/**
 * @param {object} providerItem
 * @returns {{ source?: string, themes: Array<object> }}
 */
function parseFeedAiEvaluation(providerItem) {
  const parsed = parseAiJson(providerItem);
  if (!parsed || !Array.isArray(parsed.themes)) {
    throw new Error('Feed AI response must include themes[]');
  }
  return parsed;
}

/**
 * @param {object} providerItem
 * @returns {{ model?: string, source?: string, evaluations: Array<object> }}
 */
function parseCanonicalAiEvaluation(providerItem) {
  const parsed = parseAiJson(providerItem);
  if (!parsed || !Array.isArray(parsed.evaluations)) {
    throw new Error('Canonical AI response must include evaluations[]');
  }
  return {
    model: parsed.model || 'unknown',
    source: parsed.source || 'ai-node',
    evaluations: parsed.evaluations,
  };
}

/**
 * @param {object} providerItem
 */
function parseAiJson(providerItem) {
  const text = extractAssistantText(providerItem);
  if (!text) {
    throw new Error('AI response missing assistant text');
  }
  const trimmed = text.trim();
  const jsonStr = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    : trimmed;
  return JSON.parse(jsonStr);
}

/**
 * @param {object} item
 */
function extractAssistantText(item) {
  if (!item || typeof item !== 'object') return '';

  const openAiContent = item.choices?.[0]?.message?.content;
  if (typeof openAiContent === 'string') return openAiContent;

  if (typeof item.text === 'string') return item.text;
  if (Array.isArray(item.content)) {
    const block = item.content.find((b) => b.type === 'text' && b.text);
    if (block) return block.text;
  }
  if (item.message?.content) {
    return extractAssistantText(item.message);
  }
  if (Array.isArray(item.output)) {
    for (const o of item.output) {
      const t = extractAssistantText(o);
      if (t) return t;
    }
  }
  return '';
}

module.exports = {
  parseFeedAiEvaluation,
  parseCanonicalAiEvaluation,
  parseAiJson,
  extractAssistantText,
};
