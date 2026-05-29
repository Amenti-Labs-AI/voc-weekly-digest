'use strict';

const DEFAULT_AI_PROVIDER = 'anthropic';

const DEFAULT_MODELS = {
  anthropic: process.env.VOC_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  openai: process.env.VOC_OPENAI_MODEL || 'gpt-4o-mini',
};

/**
 * @param {string | undefined} provider
 */
function normalizeAiProvider(provider) {
  const value = String(provider || DEFAULT_AI_PROVIDER).toLowerCase();
  return Object.prototype.hasOwnProperty.call(DEFAULT_MODELS, value)
    ? value
    : DEFAULT_AI_PROVIDER;
}

/**
 * @param {{ provider?: string, model?: string, models?: Record<string, string> } | undefined} aiEvaluation
 */
function resolveAiProviderConfig(aiEvaluation) {
  const provider = normalizeAiProvider(aiEvaluation?.provider);
  const providerModel = aiEvaluation?.models && aiEvaluation.models[provider];
  const model = providerModel || aiEvaluation?.model || DEFAULT_MODELS[provider];
  return { provider, model };
}

module.exports = {
  DEFAULT_AI_PROVIDER,
  DEFAULT_MODELS,
  normalizeAiProvider,
  resolveAiProviderConfig,
};
