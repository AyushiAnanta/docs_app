/**
 * hash.js
 * SHA-256 hash of a chunk's text, used to detect which chunks have changed
 * so we only re-embed them (cost optimization).
 */

import crypto from 'crypto';

/**
 * @param {string} text - Chunk text
 * @returns {string} hex SHA-256 hash
 */
function hashChunk(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export { hashChunk };
