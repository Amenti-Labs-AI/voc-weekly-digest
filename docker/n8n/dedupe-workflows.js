#!/usr/bin/env node
/**
 * Remove all "VOC Weekly Digest" workflows from n8n SQLite so import leaves exactly one.
 * Run from n8n image: NODE_PATH=/usr/local/lib/node_modules/n8n node /docker/n8n/dedupe-workflows.js
 */
'use strict';

const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3').verbose();

const DB_PATH = process.env.N8N_DB_PATH || '/home/node/.n8n/database.sqlite';
const WORKFLOW_NAME = process.env.N8N_WORKFLOW_NAME || 'VOC Weekly Digest';

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

async function deleteWorkflow(db, workflowId) {
  const tables = [
    ['workflow_publish_history', 'workflowId'],
    ['shared_workflow', 'workflowId'],
    ['workflow_history', 'workflowId'],
    ['execution_entity', 'workflowId'],
  ];

  for (const [table, column] of tables) {
    try {
      await run(db, `DELETE FROM ${table} WHERE ${column} = ?`, [workflowId]);
    } catch {
      // Table may not exist on older n8n schemas — ignore
    }
  }

  return run(db, 'DELETE FROM workflow_entity WHERE id = ?', [workflowId]);
}

async function main() {
  const db = openDb();
  try {
    const rows = await all(
      db,
      'SELECT id, name FROM workflow_entity WHERE name = ?',
      [WORKFLOW_NAME]
    );

    if (rows.length === 0) {
      console.log(`[voc-digest] No workflows named "${WORKFLOW_NAME}" to remove`);
      return;
    }

    for (const row of rows) {
      const n = await deleteWorkflow(db, row.id);
      console.log(`[voc-digest] Removed workflow ${row.id} (${n} row)`);
    }

    console.log(`[voc-digest] Cleared ${rows.length} workflow(s) before import`);
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error('[voc-digest] Dedupe failed:', err.message);
  process.exit(1);
});
