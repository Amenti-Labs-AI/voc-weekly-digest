'use strict';

const { createWiremockConfig } = require('../config');
const { loadProfile } = require('../profile/profile-loader');
const { fetchAllSources, extractThemeEvents } = require('../sources/source-fetcher');
const { aggregateThemes } = require('../corroboration/theme-aggregator');
const { scoreThemes } = require('../corroboration/corroboration-scorer');
const { parseMergedItems } = require('../merge/parse-merged-items');
const { evaluateThemesWithCriteriaEngine } = require('../ai/criteria-engine');
const { applyAiEvaluations } = require('../ai/apply-ai-evaluations');
const { resolveAiProviderConfig } = require('../ai/provider-config');

/**
 * @param {object} deps
 * @param {import('../config').HttpClient} deps.http
 * @param {string} [deps.wiremockBase]
 */
const REQUIRED_SOURCES = [
  'amazon_customer_feedback',
  'dtc_review_app',
  'marketplace_reviews',
  'erp_returns',
];

/**
 * @param {object} params
 * @param {object} params.profile
 * @param {Record<string, object>} params.payloads
 * @param {import('../config').HttpClient} [params.http]
 * @param {string} [params.wiremockBase]
 */
function runVocCore({ profile, payloads, aiEvaluation }) {
  const events = extractThemeEvents(payloads, profile);
  const themes = aggregateThemes(events);
  const aiCfg = resolveAiProviderConfig(profile.aiEvaluation);
  const external =
    aiEvaluation && Array.isArray(aiEvaluation.evaluations)
      ? {
          model: aiEvaluation.model || aiCfg.model,
          evaluations: aiEvaluation.evaluations,
          source: aiEvaluation.source || 'ai-node',
        }
      : null;
  const engineResult = external || evaluateThemesWithCriteriaEngine(profile, themes);
  const enrichedThemes = applyAiEvaluations(themes, engineResult);
  const normalized = scoreThemes(enrichedThemes, profile.thresholds);

  return {
    profile,
    normalized,
    aiEvaluation: {
      model: engineResult.model,
      source: external ? external.source : 'criteria-engine',
      evaluations: engineResult.evaluations,
      note: external
        ? 'Canonical document evaluated by configured AI provider node.'
        : 'Criteria engine fallback used for ranking.',
    },
    exceptionOnly: profile.digest?.exceptionOnly !== false,
  };
}

/**
 * @param {Array<{ json: object }>} items — merged HTTP responses (profile + sources)
 * @param {{ http?: import('../config').HttpClient, wiremockBase?: string }} [deps]
 */
function parseAndValidateMergedItems(items, { contextLabel }) {
  const { profile, payloads } = parseMergedItems(items);

  if (!profile) {
    const keys = items.map((i) => Object.keys(i.json || {}).join(',')).join(' | ');
    throw new Error(
      `Missing client profile in ${contextLabel} (${items.length} items). ` +
        'Set Merge Sources → Number of Inputs = 5 and connect HTTP Client Profile to input 5. ' +
        `Got keys: ${keys || 'none'}`
    );
  }

  for (const id of REQUIRED_SOURCES) {
    if (!payloads[id]) {
      throw new Error(`Missing source "${id}" in ${contextLabel}`);
    }
  }

  return { profile, payloads };
}

async function runVocFromMergedSources(items, deps = {}) {
  const { profile, payloads } = parseAndValidateMergedItems(items, {
    contextLabel: 'merge',
  });
  return runVocCore({ profile, payloads });
}

/**
 * @param {Array<{ json: object }>} items
 */
function buildCanonicalFromMergedSources(items) {
  const { profile, payloads } = parseAndValidateMergedItems(items, {
    contextLabel: 'merged items',
  });

  const feeds = Object.values(payloads).map((payload) => ({
    source: payload.source,
    payload,
  }));

  return {
    generatedAt: new Date().toISOString(),
    client: {
      name: profile.clientName,
      timezone: profile.timezone,
    },
    thresholds: profile.thresholds,
    themeTaxonomy: profile.themeTaxonomy || [],
    criteria: profile.aiEvaluation?.criteria || [],
    feeds,
  };
}

/**
 * @param {{ mergedItems: Array<object>, aiEvaluation?: { model?: string, source?: string, evaluations?: Array<object> } }} canonicalPackage
 */
function runVocFromCanonicalPackage(canonicalPackage) {
  const mergedItems = (canonicalPackage.mergedItems || []).map((json) => ({ json }));
  const { profile, payloads } = parseAndValidateMergedItems(mergedItems, {
    contextLabel: 'canonical package',
  });

  return runVocCore({
    profile,
    payloads,
    aiEvaluation: canonicalPackage.aiEvaluation,
  });
}

async function runVocPipeline({ http, wiremockBase = 'http://wiremock:8080' }) {
  const config = createWiremockConfig(wiremockBase);
  const profile = await loadProfile(http, config.profileUrl);
  const payloads = await fetchAllSources(http, config.sources);

  return runVocCore({ profile, payloads });
}

module.exports = {
  runVocPipeline,
  runVocFromMergedSources,
  runVocFromCanonicalPackage,
  buildCanonicalFromMergedSources,
  runVocCore,
  parseAndValidateMergedItems,
};
