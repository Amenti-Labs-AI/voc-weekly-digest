#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../src/n8n/workflows/voc-weekly-digest.json');
const wf = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const CRED = {
  anthropicApi: {
    id: 'vocAnthropicApi01',
    name: 'Anthropic API (VOC)',
  },
  openAiApi: {
    id: 'vocOpenAiApi01',
    name: 'OpenAI API (VOC)',
  },
};

const MODEL_EXPR = {
  __rl: true,
  mode: 'id',
  value: '={{ $json.aiModel }}',
};

const LEGACY_NODE_NAMES = [
  'AI Provider is OpenAI?',
  'Evaluate Canonical (Anthropic)',
  'Evaluate Canonical (OpenAI)',
  'Save Demo Payload',
];

const LEGACY_NAME_PREFIXES = [
  'Prepare Claude ',
  'Prepare Canonical Claude',
  'Parse Claude ',
  'Parse Canonical Claude',
  'Claude Evaluate ',
];

const MANAGED_NODES = [
  {
    id: 'a1b2c3d4-002d-4000-8000-00000000002d',
    name: 'Build Canonical VOC',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1040, 340],
    parameters: { mode: 'runOnceForAllItems', jsCode: '// synced by workflow:sync' },
  },
  {
    id: 'a1b2c3d4-002e-4000-8000-00000000002e',
    name: 'Load AI Guidelines Markdown',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1260, 340],
    parameters: {
      method: 'GET',
      url: "={{ $env.VOC_MOCK_BASE_URL.replace(/\\/$/, '') + '/mock/config/ai-evaluation-guidelines.md' }}",
      options: {
        response: {
          response: {
            responseFormat: 'string',
          },
        },
      },
    },
  },
  {
    id: 'a1b2c3d4-002f-4000-8000-00000000002f',
    name: 'Prepare Canonical AI Prompt',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1480, 340],
    parameters: { mode: 'runOnceForEachItem', jsCode: '// synced by workflow:sync' },
  },
  {
    id: 'a1b2c3d4-003a-4000-8000-00000000003a',
    name: 'AI Provider is OpenAI?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: [1700, 340],
    parameters: {
      conditions: {
        options: {
          caseSensitive: false,
          leftValue: '',
          typeValidation: 'strict',
        },
        conditions: [
          {
            id: 'cond-openai-provider',
            leftValue: '={{ $json.aiProvider }}',
            rightValue: 'openai',
            operator: {
              type: 'string',
              operation: 'equals',
            },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
  },
  {
    id: 'a1b2c3d4-0030-4000-8000-000000000030',
    name: 'Evaluate Canonical (OpenAI)',
    type: '@n8n/n8n-nodes-langchain.openAi',
    typeVersion: 1.8,
    position: [1920, 260],
    credentials: { openAiApi: CRED.openAiApi },
    parameters: {
      resource: 'chat',
      operation: 'complete',
      model: MODEL_EXPR,
      messages: {
        values: [{ content: '={{ $json.prompt }}', role: 'user' }],
      },
      options: {},
    },
  },
  {
    id: 'a1b2c3d4-0031-4000-8000-000000000031',
    name: 'Evaluate Canonical (Anthropic)',
    type: '@n8n/n8n-nodes-langchain.anthropic',
    typeVersion: 1,
    position: [1920, 420],
    credentials: { anthropicApi: CRED.anthropicApi },
    parameters: {
      resource: 'text',
      operation: 'message',
      modelId: MODEL_EXPR,
      messages: {
        values: [{ content: '={{ $json.prompt }}', role: 'user' }],
      },
      options: {},
    },
  },
  {
    id: 'a1b2c3d4-0033-4000-8000-000000000033',
    name: 'Parse Canonical AI',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2140, 340],
    parameters: { mode: 'runOnceForEachItem', jsCode: '// synced by workflow:sync' },
  },
];

const CONNECTIONS = {
  'Weekly Monday 7am': {
    main: [[{ node: 'HTTP Client Profile', type: 'main', index: 0 }]],
  },
  'HTTP Client Profile': {
    main: [
      [
        { node: 'HTTP Amazon Topics', type: 'main', index: 0 },
        { node: 'HTTP DTC Reviews', type: 'main', index: 0 },
        { node: 'HTTP Marketplace Reviews', type: 'main', index: 0 },
        { node: 'HTTP ERP Returns', type: 'main', index: 0 },
        { node: 'Merge Sources', type: 'main', index: 4 },
      ],
    ],
  },
  'HTTP Amazon Topics': { main: [[{ node: 'Merge Sources', type: 'main', index: 0 }]] },
  'HTTP DTC Reviews': { main: [[{ node: 'Merge Sources', type: 'main', index: 1 }]] },
  'HTTP Marketplace Reviews': { main: [[{ node: 'Merge Sources', type: 'main', index: 2 }]] },
  'HTTP ERP Returns': { main: [[{ node: 'Merge Sources', type: 'main', index: 3 }]] },
  'Merge Sources': { main: [[{ node: 'Build Canonical VOC', type: 'main', index: 0 }]] },
  'Build Canonical VOC': {
    main: [[{ node: 'Load AI Guidelines Markdown', type: 'main', index: 0 }]],
  },
  'Load AI Guidelines Markdown': {
    main: [[{ node: 'Prepare Canonical AI Prompt', type: 'main', index: 0 }]],
  },
  'Prepare Canonical AI Prompt': {
    main: [[{ node: 'AI Provider is OpenAI?', type: 'main', index: 0 }]],
  },
  'AI Provider is OpenAI?': {
    main: [
      [{ node: 'Evaluate Canonical (OpenAI)', type: 'main', index: 0 }],
      [{ node: 'Evaluate Canonical (Anthropic)', type: 'main', index: 0 }],
    ],
  },
  'Evaluate Canonical (OpenAI)': {
    main: [[{ node: 'Parse Canonical AI', type: 'main', index: 0 }]],
  },
  'Evaluate Canonical (Anthropic)': {
    main: [[{ node: 'Parse Canonical AI', type: 'main', index: 0 }]],
  },
  'Parse Canonical AI': {
    main: [[{ node: 'Consolidate Themes', type: 'main', index: 0 }]],
  },
  'Consolidate Themes': {
    main: [[{ node: 'Actionable themes?', type: 'main', index: 0 }]],
  },
  'Actionable themes?': {
    main: [
      [{ node: 'Build Digest', type: 'main', index: 0 }],
      [{ node: 'All Clear', type: 'main', index: 0 }],
    ],
  },
  'Build Digest': { main: [[{ node: 'Publish Demo View', type: 'main', index: 0 }]] },
  'All Clear': { main: [[{ node: 'Publish Demo View', type: 'main', index: 0 }]] },
};

function removeNodeByName(name) {
  wf.nodes = wf.nodes.filter((n) => n.name !== name);
  delete wf.connections[name];
}

function removeLegacyNodes() {
  for (const node of [...wf.nodes]) {
    if (
      LEGACY_NODE_NAMES.includes(node.name) ||
      LEGACY_NAME_PREFIXES.some((prefix) => node.name.startsWith(prefix))
    ) {
      removeNodeByName(node.name);
    }
  }
}

function upsertNode(node) {
  const idx = wf.nodes.findIndex((n) => n.name === node.name);
  if (idx >= 0) wf.nodes[idx] = { ...wf.nodes[idx], ...node };
  else wf.nodes.push(node);
}

function ensureConsolidateName() {
  const normalize = wf.nodes.find((n) => n.name === 'Normalize and Corroborate');
  if (normalize) normalize.name = 'Consolidate Themes';
}

function alignLayout() {
  const merge = wf.nodes.find((n) => n.name === 'Merge Sources');
  if (merge) {
    merge.position = [820, 340];
    merge.parameters.mode = 'append';
    merge.parameters.numberInputs = 5;
  }
  const consolidate = wf.nodes.find((n) => n.name === 'Consolidate Themes');
  if (consolidate) consolidate.position = [2360, 340];
  const ifNode = wf.nodes.find((n) => n.name === 'Actionable themes?');
  if (ifNode) ifNode.position = [2580, 340];
  const publish = wf.nodes.find((n) => n.name === 'Publish Demo View');
  if (publish) publish.position = [2800, 340];
}

removeLegacyNodes();
ensureConsolidateName();
for (const node of MANAGED_NODES) upsertNode(node);
alignLayout();
wf.connections = CONNECTIONS;

wf.meta = {
  ...(wf.meta || {}),
  templateCredsSetupCompleted: true,
};

const sticky = wf.nodes.find((n) => n.name === 'Sticky Note');
if (sticky) {
  sticky.parameters.content =
    '## Brief output\nBuild canonical JSON, load AI guidelines, evaluate with provider from client profile (`aiEvaluation.provider` + `model`), then consolidate.\n\nOutput stays in `digestMarkdown`.';
}

fs.writeFileSync(workflowPath, JSON.stringify(wf, null, 2) + '\n');
console.log('Patched canonical AI workflow graph →', workflowPath);
