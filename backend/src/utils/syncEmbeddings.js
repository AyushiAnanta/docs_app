/**
 * syncEmbeddings.js
 * Called after a successful doc save (PATCH /api/v1/docs/:id).
 * 1. Re-chunks the doc
 * 2. Hashes each chunk text
 * 3. Diffs against stored hashes — only re-embeds changed/new chunks
 * 4. Deletes embeddings for chunks that no longer exist
 * 5. Upserts new/changed chunks into the Embedding collection
 *
 * This is the core cost-optimization: we track skippedCount vs embeddedCount per save.
 */

import { chunkTipTapDoc } from './chunker.js';
import { hashChunk } from './hash.js';
import { embedTexts } from './embedder.js';
import { Embedding } from '../models/embedding.model.js';

/**
 * Parse the doc content to a TipTap-compatible JSON object.
 * The DB may store content as a JSON string or as an object.
 */
function parseContent(raw) {
  if (!raw) return { type: 'doc', content: [] };
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      // Treat as plain text wrapped in a paragraph
      return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }],
      };
    }
  }
  // Already an object
  return raw;
}

/**
 * Normalize chunk text before hashing to prevent false mismatches
 * caused by trailing whitespace, BOM characters, or multiple spaces.
 */
function normalizeForHash(text) {
  return text
    .replace(/\uFEFF/g, '')      // Strip BOM
    .replace(/\r\n/g, '\n')      // Normalize line endings
    .replace(/[ \t]+\n/g, '\n')  // Strip trailing whitespace per line
    .replace(/\n+$/g, '')        // Strip trailing newlines
    .trim();
}

/**
 * @param {string} docId - MongoDB ObjectId string
 * @param {string} ownerId - MongoDB ObjectId string (owner of the doc)
 * @param {*} rawContent - doc.content from MongoDB (object or stringified JSON)
 */
async function syncEmbeddings(docId, ownerId, rawContent) {
  const tiptapDoc = parseContent(rawContent);

  // 1. Chunk the document
  const chunks = chunkTipTapDoc(docId, tiptapDoc);

  if (chunks.length === 0) {
    console.log(`[syncEmbeddings] docId=${docId} | no chunks produced — skipping`);
    return;
  }

  // 2. Fetch existing embeddings for this doc
  const existingEmbeddings = await Embedding.find(
    { docId },
    { chunkIndex: 1, chunkHash: 1, _id: 1 }
  ).lean();

  const existingByIndex = new Map(existingEmbeddings.map((e) => [e.chunkIndex, e]));
  const incomingIndices = new Set(chunks.map((c) => c.chunkIndex));

  // 3. Delete embeddings for chunks that no longer exist in the doc
  const stalledIndices = existingEmbeddings
    .filter((e) => !incomingIndices.has(e.chunkIndex))
    .map((e) => e.chunkIndex);

  if (stalledIndices.length > 0) {
    await Embedding.deleteMany({ docId, chunkIndex: { $in: stalledIndices } });
  }

  // 4. Determine which chunks need re-embedding (changed hash or new)
  const chunksToEmbed = [];
  const chunksToSkip = [];

  for (const chunk of chunks) {
    const normalizedText = normalizeForHash(chunk.text);
    const newHash = hashChunk(normalizedText);
    const existing = existingByIndex.get(chunk.chunkIndex);

    if (!existing) {
      // New chunk — no existing embedding at this index
      chunksToEmbed.push({ ...chunk, newHash });
    } else if (existing.chunkHash !== newHash) {
      // Changed chunk — hash mismatch
      chunksToEmbed.push({ ...chunk, newHash });
    } else {
      // Unchanged — skip
      chunksToSkip.push(chunk.chunkIndex);
    }
  }

  console.log(
    `[syncEmbeddings] docId=${docId} | total=${chunks.length} | re-embed=${chunksToEmbed.length} | skipped=${chunksToSkip.length} | deleted=${stalledIndices.length} | existing=${existingEmbeddings.length}`
  );

  if (chunksToEmbed.length === 0) return;

  // ── Debug: if re-embedding everything despite existing records, log why ──
  if (existingEmbeddings.length > 0 && chunksToSkip.length === 0) {
    console.warn(
      `[syncEmbeddings] WARNING: Re-embedding ALL ${chunksToEmbed.length} chunks despite ${existingEmbeddings.length} existing embeddings. ` +
      `This suggests chunk text or boundaries changed for every chunk. First mismatch sample:`
    );
    const sample = chunksToEmbed[0];
    const existingSample = existingByIndex.get(sample.chunkIndex);
    if (existingSample) {
      console.warn(
        `  chunkIndex=${sample.chunkIndex} | stored hash=${existingSample.chunkHash} | new hash=${sample.newHash}`
      );
      console.warn(
        `  new text (first 120 chars): "${normalizeForHash(sample.text).slice(0, 120)}"`
      );
    } else {
      console.warn(`  chunkIndex=${sample.chunkIndex} | no existing embedding at this index (new chunk)`);
    }
  }

  // 5. Batch-embed all changed/new chunks (throttled to respect Gemini rate limits)
  try {
    const texts = chunksToEmbed.map((c) => c.text);
    const vectors = await embedTexts(texts);

    // Filter out any chunks whose embeddings returned empty (shouldn't happen, but defensive)
    const ops = chunksToEmbed
      .map((chunk, i) => {
        if (!vectors[i] || vectors[i].length === 0) return null;
        const normalizedText = normalizeForHash(chunk.text);
        return {
          updateOne: {
            filter: { docId, chunkIndex: chunk.chunkIndex },
            update: {
              $set: {
                docId,
                ownerId,
                headingPath: chunk.headingPath,
                chunkText: chunk.text,
                chunkHash: hashChunk(normalizedText),  // Store the normalized hash
                chunkIndex: chunk.chunkIndex,
                isCode: chunk.isCode || false,
                vector: vectors[i],
              },
            },
            upsert: true,
          },
        };
      })
      .filter(Boolean);

    if (ops.length > 0) {
      await Embedding.bulkWrite(ops, { ordered: false });
      console.log(`[syncEmbeddings] docId=${docId} | upserted ${ops.length} embeddings`);
    }
  } catch (err) {
    // Don't let embedding failures crash the doc save — log and move on.
    // The next edit will re-trigger syncEmbeddings and retry the changed chunks.
    console.error(
      `[syncEmbeddings] Embedding failed for docId=${docId} — ${err.message}. Embeddings will be retried on next save.`
    );
  }
}

export { syncEmbeddings };
