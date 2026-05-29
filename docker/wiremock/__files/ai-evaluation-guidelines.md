# VOC AI evaluation guidelines

## Objective
- Evaluate the canonical VOC JSON and prioritize leadership action.
- Focus on corroborated product, packaging, fulfillment, and returns-risk signals.

## Scoring guidance
- `act_now`: strong corroboration and material impact this week.
- `watch`: emerging or partially corroborated signal.
- `exclude`: non-material or positive-only signal for this exception digest.

## Criteria
- Cross-source corroboration should increase urgency.
- Returns alignment should increase urgency when reasons support the theme.
- Mention volume should influence confidence and recommendation.
- Positive-only praise should usually be excluded.

## Output contract
Return only JSON:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "source": "anthropic-node",
  "evaluations": [
    {
      "theme": "packaging_damaged",
      "recommendation": "act_now",
      "confidence": 0.92,
      "rationale": "Corroborated across feedback and returns.",
      "criteriaMet": ["cross_source_corroboration", "returns_alignment", "materiality"],
      "criteriaMissed": []
    }
  ]
}
```
