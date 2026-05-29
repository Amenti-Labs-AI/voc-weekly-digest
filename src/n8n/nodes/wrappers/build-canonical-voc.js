// Build canonical VOC document from merged sources.
const canonicalDoc = voc.buildCanonicalFromMergedSources($input.all());
const mergedItems = $input.all().map((item) => item.json);

return [
  {
    json: {
      canonicalDoc,
      mergedItems,
    },
  },
];
