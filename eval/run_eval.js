/**
 * run_eval.js
 * Evaluation script for the RAG hybrid search pipeline.
 * Runs directly against MongoDB + Atlas Vector Search using hybridSearch controller.
 *
 * Usage:
 *   node eval/run_eval.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load backend/.env manually
const envPath = resolve(__dirname, '../backend/.env');
if (existsSync(envPath)) {
  const envConfig = readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { hybridSearch } from '../backend/src/controllers/search.controller.js';

const evalSet = JSON.parse(readFileSync(resolve(__dirname, 'eval_set.json'), 'utf8'));

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  // Ensure DB name 'test' or DB_NAME is connected correctly
  const parts = uri.split('?');
  const fullUri = parts[0] + 'test?' + (parts[1] || '');

  await mongoose.connect(fullUri);

  const results = [];
  let top1Hits = 0;
  let top5Hits = 0;

  console.log(`\n${'─'.repeat(70)}`);
  console.log('  RAG Hybrid Search Evaluation');
  console.log(`  ${evalSet.filter(e => !e._comment).length} questions evaluated`);
  console.log(`${'─'.repeat(70)}\n`);

  const testItems = evalSet.filter((e) => !e._comment);

  for (const item of testItems) {
    if (item.ownerId.startsWith('REPLACE') || item.docId.startsWith('REPLACE')) {
      console.warn(`  ⚠  SKIP "${item.question}" — placeholder ownerId/docId not filled in`);
      continue;
    }

    let rank1Match = false;
    let top5Match = false;
    let error = null;

    try {
      const hits = await hybridSearch(item.question, item.ownerId, 5);

      for (let i = 0; i < hits.length; i++) {
        const hit = hits[i];
        const sameDoc = hit.docId?.toString() === item.docId;
        const sameChunk = hit.chunkIndex === item.expectedChunkIndex;

        if (sameDoc && sameChunk) {
          if (i === 0) rank1Match = true;
          if (i < 5) top5Match = true;
          break;
        }
      }

      if (rank1Match) top1Hits++;
      if (top5Match) top5Hits++;

      const icon = rank1Match ? '✅' : top5Match ? '🟡' : '❌';
      const rankStr = rank1Match ? 'rank 1' : top5Match ? 'top 5' : 'not found';
      console.log(`  ${icon}  [${rankStr.padEnd(9)}] "${item.question}"`);
      if (!top5Match) {
        console.log(`         Expected: docId=${item.docId} chunkIndex=${item.expectedChunkIndex}`);
        console.log(`         Got:      ${hits.slice(0, 3).map(h => `(doc=${h.docId?.toString()?.slice(-6)}, ci=${h.chunkIndex})`).join(', ') || 'no results'}`);
      }
    } catch (err) {
      error = err.message;
      console.log(`  ⚠️  ERROR "${item.question}": ${error}`);
    }

    results.push({ question: item.question, rank1Match, top5Match, error });
  }

  const total = results.filter((r) => !r.error).length;

  console.log(`\n${'─'.repeat(70)}`);
  console.log('  Evaluation Results');
  console.log(`${'─'.repeat(70)}`);
  console.log(`  Questions evaluated : ${total}`);
  console.log(`  Top-1 accuracy      : ${top1Hits}/${total} = ${total ? ((top1Hits / total) * 100).toFixed(1) : 0}%`);
  console.log(`  Top-5 accuracy      : ${top5Hits}/${total} = ${total ? ((top5Hits / total) * 100).toFixed(1) : 0}%`);
  console.log(`${'─'.repeat(70)}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
