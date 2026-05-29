'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateThemesWithCriteriaEngine } = require('../src/voc/ai/criteria-engine');
const { applyAiEvaluations } = require('../src/voc/ai/apply-ai-evaluations');
const { scoreThemes } = require('../src/voc/corroboration/corroboration-scorer');

const profile = {
  returnReasonMap: {
    DAMAGED: ['packaging_damaged', 'leak_or_spill'],
    DEFECTIVE: ['pump_failure'],
  },
  aiEvaluation: {
    criteria: [
      { id: 'cross_source_corroboration', weight: 'high' },
      { id: 'returns_alignment', weight: 'high' },
      { id: 'materiality', weight: 'medium' },
      { id: 'exception_focus', weight: 'medium' },
    ],
  },
};

describe('AI criteria engine', () => {
  it('recommends act_now for corroborated packaging with returns', () => {
    const themes = [
      {
        theme: 'packaging_damaged',
        corroborationScore: 3,
        sources: ['amazon_customer_feedback', 'erp_returns'],
        skus: ['SKU-1001'],
        mentions: 47,
        snippets: ['crushed box'],
        erpWeight: 1,
      },
    ];
    const { evaluations } = evaluateThemesWithCriteriaEngine(profile, themes);
    assert.equal(evaluations[0].recommendation, 'act_now');
  });

  it('excludes positive-only easy_to_use from exception digest', () => {
    const themes = [
      {
        theme: 'easy_to_use',
        corroborationScore: 1,
        sources: ['amazon_customer_feedback'],
        skus: [],
        mentions: 89,
        snippets: [],
        erpWeight: 0,
      },
    ];
    const { evaluations } = evaluateThemesWithCriteriaEngine(profile, themes);
    assert.equal(evaluations[0].recommendation, 'exclude');
  });

  it('gates act now on AI recommendation when scoring', () => {
    const themes = [
      {
        theme: 'packaging_damaged',
        corroborationScore: 3,
        sources: ['a', 'b'],
        skus: [],
        mentions: 10,
        snippets: [],
        erpWeight: 1,
        aiRecommendation: 'act_now',
        aiRationale: 'Corroborated.',
      },
      {
        theme: 'easy_to_use',
        corroborationScore: 3,
        sources: ['a', 'b'],
        skus: [],
        mentions: 10,
        snippets: [],
        erpWeight: 0,
        aiRecommendation: 'exclude',
      },
    ];
    const scored = scoreThemes(themes, { minCorroborationScore: 2, minMentionsForActNow: 5 });
    assert.equal(scored.actNow.length, 1);
    assert.equal(scored.actNow[0].theme, 'packaging_damaged');
  });
});

describe('applyAiEvaluations', () => {
  it('attaches AI fields to theme rows', () => {
    const themes = [{ theme: 'pump_failure', mentions: 1 }];
    const enriched = applyAiEvaluations(themes, {
      evaluations: [
        {
          theme: 'pump_failure',
          recommendation: 'watch',
          confidence: 0.7,
          rationale: 'Single source.',
          criteriaMet: ['materiality'],
          criteriaMissed: ['cross_source_corroboration'],
        },
      ],
    });
    assert.equal(enriched[0].aiRecommendation, 'watch');
    assert.equal(enriched[0].aiRationale, 'Single source.');
  });
});
