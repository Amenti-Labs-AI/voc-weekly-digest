// Parse canonical AI evaluation (Anthropic or OpenAI node output).
const base = $('Prepare Canonical AI Prompt').first().json;
const aiEvaluation = voc.parseCanonicalAiEvaluation($json);

return {
  json: {
    canonicalDoc: base.canonicalDoc,
    mergedItems: base.mergedItems,
    aiEvaluation,
  },
};
