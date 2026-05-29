// Compose canonical AI prompt from profile config + guidelines markdown.
const canonicalNode = $('Build Canonical VOC').first().json;
const guidelinesText = typeof $json === 'string' ? $json : $json.body || $json.data || '';

if (!guidelinesText || typeof guidelinesText !== 'string') {
  throw new Error('Guidelines markdown response missing text body');
}

function findProfile(mergedItems) {
  for (const item of mergedItems || []) {
    if (item?.clientName && item?.aiEvaluation) return item;
  }
  return null;
}

const profile = findProfile(canonicalNode.mergedItems);
const { provider: aiProvider, model: aiModel } = voc.resolveAiProviderConfig(
  profile?.aiEvaluation
);

const prompt = [
  'You are evaluating consolidated VOC signals for weekly executive action.',
  'Use the markdown guidelines exactly as policy.',
  '',
  '## Evaluation guidelines (markdown)',
  guidelinesText,
  '',
  '## Canonical VOC JSON',
  JSON.stringify(canonicalNode.canonicalDoc, null, 2),
  '',
  'Return only valid JSON with this shape:',
  `{"model":"${aiModel}","source":"${aiProvider}-node","evaluations":[{"theme":"<id>","recommendation":"act_now|watch|exclude","confidence":0.0,"rationale":"...","criteriaMet":["..."],"criteriaMissed":["..."]}]}`,
].join('\n');

return {
  json: {
    canonicalDoc: canonicalNode.canonicalDoc,
    mergedItems: canonicalNode.mergedItems,
    guidelinesMarkdown: guidelinesText,
    aiProvider,
    aiModel,
    prompt,
  },
};
