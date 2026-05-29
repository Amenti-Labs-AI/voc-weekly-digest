const { profile, normalized } = $json;
const digestMarkdown = voc.buildDigest(profile, normalized);

return [
  {
    json: {
      profile,
      normalized,
      aiEvaluation: $json.aiEvaluation || null,
      canonicalDoc: $json.canonicalDoc || null,
      digestMarkdown,
      delivered: true,
      actNowCount: normalized.actNow.length,
      watchListCount: normalized.watchList.length,
    },
  },
];
