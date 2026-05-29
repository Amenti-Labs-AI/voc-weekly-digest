// Consolidates merged payloads and applies canonical AI evaluation.
const result = voc.runVocFromCanonicalPackage($json);
return [
  {
    json: {
      ...result,
      canonicalDoc: $json.canonicalDoc || null,
    },
  },
];
