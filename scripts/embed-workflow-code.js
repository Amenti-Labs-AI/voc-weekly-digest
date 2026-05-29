#!/usr/bin/env node
/** Bundle src/voc and sync Code node JS into workflow JSON */
const fs = require('fs');
const path = require('path');

require('./bundle-voc-for-n8n.js');

const root = path.join(__dirname, '..');
const workflowPath = path.join(root, 'src/n8n/workflows/voc-weekly-digest.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const bundledDir = path.join(root, 'src/n8n/nodes/bundled');
const wrappersDir = path.join(root, 'src/n8n/nodes/wrappers');

const feedAiBundle = 'feed-ai.iife.js';

const nodeConfig = {
  'Build Canonical VOC': { bundle: 'normalize.iife.js', wrapper: 'build-canonical-voc.js' },
  'Prepare Canonical AI Prompt': {
    bundle: feedAiBundle,
    wrapper: 'prepare-canonical-ai-prompt.js',
  },
  'Parse Canonical AI': { bundle: feedAiBundle, wrapper: 'parse-canonical-ai.js' },
  'Consolidate Themes': {
    bundle: 'normalize.iife.js',
    wrapper: 'normalize-and-corroborate.js',
    mode: 'runOnceForAllItems',
  },
  'Build Digest': {
    bundle: 'digest.iife.js',
    wrapper: 'build-digest.js',
  },
  'All Clear': {
    bundle: 'digest.iife.js',
    wrapper: 'all-clear.js',
  },
};

function composeCode(bundleFile, wrapperFile) {
  const parts = [];
  if (bundleFile) {
    parts.push(fs.readFileSync(path.join(bundledDir, bundleFile), 'utf8').trim());
  }
  parts.push(fs.readFileSync(path.join(wrappersDir, wrapperFile), 'utf8').trim());
  return `${parts.join('\n\n')}\n`;
}

for (const node of workflow.nodes) {
  if (node.name === 'Merge Sources') {
    node.parameters.mode = 'append';
    node.parameters.numberInputs = 5;
    delete node.parameters.combineBy;
  }
  if (node.type === 'n8n-nodes-base.httpRequest') {
    node.parameters.options = {
      ...(node.parameters.options || {}),
      response: {
        response: {
          responseFormat: 'json',
        },
      },
    };
  }

  const cfg = nodeConfig[node.name];
  if (!cfg) continue;
  node.parameters.jsCode = composeCode(cfg.bundle, cfg.wrapper);
  if (cfg.mode) node.parameters.mode = cfg.mode;
}

for (const node of workflow.nodes) {
  if (node.name !== 'Load AI Guidelines Markdown') continue;
  node.parameters.options = {
    ...(node.parameters.options || {}),
    response: {
      response: {
        responseFormat: 'string',
      },
    },
  };
}

const MODEL_EXPR = {
  __rl: true,
  mode: 'id',
  value: '={{ $json.aiModel }}',
};

for (const node of workflow.nodes) {
  if (node.type?.includes('anthropic')) {
    if (node.parameters.model && !node.parameters.modelId) {
      node.parameters.modelId = node.parameters.model;
      delete node.parameters.model;
    }
    node.parameters.modelId = MODEL_EXPR;
  }
  if (node.type?.includes('openAi')) {
    node.parameters.model = MODEL_EXPR;
  }
}

workflow.meta = {
  ...(workflow.meta || {}),
  templateCredsSetupCompleted: true,
};

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2) + '\n');
console.log('Synced Code nodes → src/n8n/workflows/voc-weekly-digest.json');
