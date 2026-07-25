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
 * @param {string} docId - MongoDB ObjectId string
 * @param {string} ownerId - MongoDB ObjectId string (owner of the doc)
 * @param {*} rawContent - doc.content from MongoDB (object or stringified JSON)
 */
async function syncEmbeddings(docId, ownerId, rawContent) {
  const tiptapDoc = parseContent(rawContent);

  // 1. Chunk the document
  const chunks = chunkTipTapDoc(docId, tiptapDoc);

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
    const newHash = hashChunk(chunk.text);
    const existing = existingByIndex.get(chunk.chunkIndex);

    if (!existing || existing.chunkHash !== newHash) {
      chunksToEmbed.push({ ...chunk, newHash });
    } else {
      chunksToSkip.push(chunk.chunkIndex);
    }
  }

  console.log(
    `[syncEmbeddings] docId=${docId} | total=${chunks.length} | re-embed=${chunksToEmbed.length} | skipped=${chunksToSkip.length} | deleted=${stalledIndices.length}`
  );

  if (chunksToEmbed.length === 0) return;

  // 5. Batch-embed all changed/new chunks in a single API call
  const texts = chunksToEmbed.map((c) => c.text);
  const vectors = await embedTexts(texts);

  // 6. Upsert each re-embedded chunk
  const ops = chunksToEmbed.map((chunk, i) => ({
    updateOne: {
      filter: { docId, chunkIndex: chunk.chunkIndex },
      update: {
        $set: {
          docId,
          ownerId,
          headingPath: chunk.headingPath,
          chunkText: chunk.text,
          chunkHash: chunk.newHash,
          chunkIndex: chunk.chunkIndex,
          isCode: chunk.isCode || false,
          vector: vectors[i],
        },
      },
      upsert: true,
    },
  }));

  await Embedding.bulkWrite(ops, { ordered: false });
}

export { syncEmbeddings };
