const digestMarkdown =
  '**All clear.** No corroborated themes met threshold (exception-only).';
const { profile, normalized } = $json;

return [
  {
    json: {
      profile,
      normalized,
      aiEvaluation: $json.aiEvaluation || null,
      canonicalDoc: $json.canonicalDoc || null,
      digestMarkdown,
      delivered: false,
      actNowCount: 0,
      watchListCount: 0,
    },
  },
];
