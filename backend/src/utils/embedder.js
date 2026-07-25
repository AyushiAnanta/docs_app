/**
 * embedder.js
 * Wraps Gemini's gemini-embedding-2 endpoint via @google/generative-ai.
 * Emits 3072-dimensional embedding vectors.
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

/**
 * Embed a single string.
 * @param {string} text
 * @returns {Promise<number[]>} 3072-dimensional float vector
 */
async function embedText(text) {
  if (!text || !text.trim()) return [];
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const res = await model.embedContent(text);
  return res.embedding.values;
}

/**
 * Embed an array of strings concurrently using embedContent.
 * @param {string[]} texts
 * @returns {Promise<number[][]>} Array of embedding vectors (3072 dims each)
 */
async function embedTexts(texts) {
  if (!texts || texts.length === 0) return [];
  return Promise.all(texts.map((text) => embedText(text)));
}

export { embedTexts, embedText, EMBEDDING_DIMS };
