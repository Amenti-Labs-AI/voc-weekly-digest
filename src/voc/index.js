'use strict';

const { runVocPipeline, runVocFromMergedSources } = require('./pipeline/voc-pipeline');
const { buildDigest } = require('./digest/digest-builder');

module.exports = { runVocPipeline, runVocFromMergedSources, buildDigest };
