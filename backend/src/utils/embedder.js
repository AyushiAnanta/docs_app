/**
 * embedder.js
 * Wraps Gemini's gemini-embedding-2 endpoint via @google/generative-ai.
 * Emits 3072-dimensional embedding vectors.
 *
 * Rate-limit aware:
 * - All Gemini calls are serialized through a shared token-bucket rate limiter
 *   (global across syncEmbeddings AND hybridSearch queries) to stay under quota.
 * - embedText retries on 429 with exponential backoff (up to 3 retries).
 * - embedTexts processes in throttled batches.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let _genAI = null;

function getClient() {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

const EMBEDDING_MODEL = 'gemini-embedding-2';
const EMBEDDING_DIMS = 3072; // gemini-embedding-2 output dimension

// ── Global rate limiter ──────────────────────────────────────────────
// Token-bucket shared across ALL callers (syncEmbeddings + hybridSearch).
// Limits total Gemini embedding calls to TOKENS_PER_WINDOW per WINDOW_MS.
const TOKENS_PER_WINDOW = 80;   // Stay under the 100/min hard ceiling
const WINDOW_MS = 60_000;       // 1 minute window
const BATCH_SIZE = 10;          // Concurrent calls per batch
const MAX_RETRIES = 3;

let _tokenCount = 0;
let _windowStart = Date.now();

/**
 * Sleep helper.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Acquire a rate-limit token. Blocks until a token is available.
 * Shared across embedText() and embedTexts() — any function calling
 * Gemini embeddings goes through this single bottleneck.
 */
async function acquireToken() {
  while (true) {
    const now = Date.now();
    // Reset window if expired
    if (now - _windowStart >= WINDOW_MS) {
      _tokenCount = 0;
      _windowStart = now;
    }
    if (_tokenCount < TOKENS_PER_WINDOW) {
      _tokenCount++;
      return;
    }
    // Window exhausted — wait for it to reset
    const waitMs = WINDOW_MS - (now - _windowStart) + 100; // +100ms buffer
    console.log(`[rate-limiter] Quota ceiling (${TOKENS_PER_WINDOW}/min) reached — pausing ${Math.round(waitMs / 1000)}s`);
    await sleep(waitMs);
  }
}

/**
 * Detect if a @google/generative-ai error is a 429 rate limit.
 * The SDK throws GoogleGenerativeAIFetchError with:
 *   err.status = 429
 *   err.statusText = "Too Many Requests"
 *   err.errorDetails = [...] (may include quotaMetric info)
 * We also check err.message as a fallback.
 */
function isRateLimitError(err) {
  if (err.status === 429) return true;
  if (err.statusText && err.statusText.includes('Too Many Requests')) return true;
  if (err.message && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'))) return true;
  return false;
}

/**
 * Embed a single string with retry on 429 (rate limit).
 * All calls go through the shared rate limiter before hitting Gemini.
 * @param {string} text
 * @returns {Promise<number[]>} 3072-dimensional float vector
 */
async function embedText(text) {
  if (!text || !text.trim()) return [];

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await acquireToken(); // Wait for rate-limit clearance
      const res = await model.embedContent(text);
      return res.embedding.values;
    } catch (err) {
      if (isRateLimitError(err) && attempt < MAX_RETRIES) {
        const delay = (attempt + 1) * 15_000; // 15s, 30s, 45s
        console.warn(
          `[embedText] Rate limited (status=${err.status || 'unknown'}) — retry ${attempt + 1}/${MAX_RETRIES} in ${delay / 1000}s`
        );
        await sleep(delay);
      } else {
        // Non-retryable error, or retries exhausted
        throw err;
      }
    }
  }
}

/**
 * Embed an array of strings in throttled batches.
 * Each individual call goes through the shared rate limiter, so total
 * throughput across ALL concurrent callers stays under quota.
 *
 * @param {string[]} texts
 * @returns {Promise<number[][]>} Array of embedding vectors (3072 dims each)
 */
async function embedTexts(texts) {
  if (!texts || texts.length === 0) return [];

  const results = new Array(texts.length);
  const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, texts.length);
    const batch = texts.slice(i, batchEnd);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`[embedTexts] Batch ${batchNum}/${totalBatches} — embedding ${batch.length} chunks`);

    // Each embedText call individually acquires a rate-limit token
    const batchResults = await Promise.all(batch.map((text) => embedText(text)));

    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
  }

  return results;
}

export { embedTexts, embedText, EMBEDDING_DIMS };
