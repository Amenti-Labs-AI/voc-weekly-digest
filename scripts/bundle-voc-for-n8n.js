#!/usr/bin/env node
/**
 * Bundle src/voc for n8n Code nodes (sandbox blocks external require).
 */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/n8n/nodes/bundled');

const bundles = [
  { name: 'normalize', entry: path.join(root, 'src/n8n/nodes/entries/normalize-entry.js') },
  { name: 'digest', entry: path.join(root, 'src/n8n/nodes/entries/digest-entry.js') },
  { name: 'feed-ai', entry: path.join(root, 'src/n8n/nodes/entries/feed-ai-entry.js') },
];

fs.mkdirSync(outDir, { recursive: true });

for (const { name, entry } of bundles) {
  const outfile = path.join(outDir, `${name}.iife.js`);
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'neutral',
    format: 'iife',
    globalName: 'voc',
    outfile,
    logLevel: 'silent',
  });
  const stat = fs.statSync(outfile);
  if (stat.size < 200) {
    throw new Error(`Bundle ${name} suspiciously small (${stat.size} bytes)`);
  }
  console.log(`Bundled ${name} → ${path.relative(root, outfile)} (${stat.size} bytes)`);
}
