/**
 * search.controller.js
 * Hybrid search: MongoDB Atlas $vectorSearch + $text keyword search,
 * blended via Reciprocal Rank Fusion (RRF).
 *
 * Access-controlled: every query is filtered by ownerId.
 */

import mongoose from 'mongoose';
import { Embedding } from '../models/embedding.model.js';
import { embedText } from '../utils/embedder.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const RRF_K = 60;

/**
 * Reciprocal Rank Fusion: merge two ranked lists into one.
 * @param {Array} vectorResults - [{docId, chunkIndex, headingPath, chunkText, ...}]
 * @param {Array} keywordResults - same shape
 * @param {number} limit - how many to return
 */
function rrfMerge(vectorResults, keywordResults, limit) {
  const scores = new Map(); // key: `${docId}:${chunkIndex}` → { score, doc }

  function addResults(results) {
    results.forEach((item, rank) => {
      const key = `${item.docId}:${item.chunkIndex}`;
      const rrfScore = 1 / (RRF_K + rank + 1);
      if (scores.has(key)) {
        scores.get(key).score += rrfScore;
      } else {
        scores.set(key, { score: rrfScore, item });
      }
    });
  }

  addResults(vectorResults);
  addResults(keywordResults);

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score }) => ({ ...item, rrfScore: score }));
}

/**
 * Core hybrid search function, usable by both the search endpoint and the RAG controller.
 * @param {string} query - User's search string
 * @param {string} ownerId - MongoDB ObjectId string of the authenticated user
 * @param {number} limit - How many results to return (default 5)
 * @returns {Promise<Array>}
 */
async function hybridSearch(query, ownerId, limit = 5) {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  // 1. Embed the query
  const queryVector = await embedText(query);

  // 2. Vector search (Atlas $vectorSearch)
  let vectorResults = [];
  try {
    vectorResults = await Embedding.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'vector',
          queryVector,
          numCandidates: 100,
          limit: 20,
          filter: { ownerId: ownerObjectId },
        },
      },
      {
        $project: {
          docId: 1,
          chunkIndex: 1,
          headingPath: 1,
          chunkText: 1,
          isCode: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);
  } catch (err) {
    // Atlas Vector Search index may not exist yet; degrade gracefully
    console.warn('[hybridSearch] vectorSearch failed (index may not exist yet):', err.message);
  }

  // 3. Text search (MongoDB $text index on chunkText)
  let keywordResults = [];
  try {
    keywordResults = await Embedding.find(
      {
        $text: { $search: query },
        ownerId: ownerObjectId,
      },
      {
        docId: 1,
        chunkIndex: 1,
        headingPath: 1,
        chunkText: 1,
        isCode: 1,
        score: { $meta: 'textScore' },
      }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();
  } catch (err) {
    console.warn('[hybridSearch] textSearch failed:', err.message);
  }

  // 4. RRF merge
  return rrfMerge(vectorResults, keywordResults, limit);
}

/**
 * POST /api/v1/search
 * Body: { query: string }
 * Auth: required (verifyJWT middleware set in routes)
 */
const search = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    throw new ApiError(400, 'query is required');
  }

  const results = await hybridSearch(query.trim(), req.user._id.toString());

  return res.status(200).json(new ApiResponse(200, results, 'Search results fetched'));
});

export { search, hybridSearch };
