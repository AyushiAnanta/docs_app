/**
 * rag.controller.js
 * Retrieval-Augmented Generation using:
 * - hybridSearch for retrieval (Atlas $vectorSearch + $text, RRF blended)
 * - Groq (llama-3.3-70b-versatile) for generation
 *
 * Returns { answer, sources } where sources include docId + headingPath
 * so the frontend can deep-link back to the relevant document section.
 */

import Groq from 'groq-sdk';
import { hybridSearch } from './search.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

let _groq = null;

function getGroqClient() {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const GROQ_MODEL = 'openai/gpt-oss-120b';
const TOP_K = 5;

/**
 * Build the context string from retrieved chunks.
 * Each chunk is prefixed with its heading path so the model can cite it.
 */
function buildContext(chunks) {
  return chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}] ${chunk.headingPath}\n${chunk.chunkText}`
    )
    .join('\n\n---\n\n');
}

/**
 * Core generation function.
 * @param {string} query
 * @param {string} ownerId
 * @returns {Promise<{ answer: string, sources: Array }>}
 */
async function answerWithCitations(query, ownerId) {
  // 1. Retrieve relevant chunks
  const chunks = await hybridSearch(query, ownerId, TOP_K);

  if (chunks.length === 0) {
    return {
      answer:
        "I couldn't find any relevant content in your workspace to answer this question. Try creating or uploading documents first.",
      sources: [],
    };
  }

  // 2. Build context block
  const context = buildContext(chunks);

  // 3. Call Groq API
  try {
    const client = getGroqClient();

    const systemPrompt = `You are a helpful assistant for a document workspace called "docs."
Your task is to answer the user's question using ONLY the context provided below.
Do not use any external knowledge — if the answer is not in the context, say so clearly.
After each factual claim, cite the source like this: [Source N].
Keep your response concise and well-structured.

Context:
${context}`;

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 1024,
    });

    const answer = response.choices[0]?.message?.content || "I couldn't generate a complete response. Please try rephrasing your question.";

    // 4. Build sources for deep-linking
    const sources = chunks.map((chunk, i) => ({
      sourceIndex: i + 1,
      docId: chunk.docId,
      headingPath: chunk.headingPath,
      chunkIndex: chunk.chunkIndex,
      preview: chunk.chunkText.slice(0, 150) + (chunk.chunkText.length > 150 ? '…' : ''),
    }));

    return { answer, sources };
  } catch (err) {
    console.error('[answerWithCitations] LLM generation error:', err);
    // Return friendly fallback response instead of throwing 400/500
    return {
      answer: "I found relevant sections in your workspace, but had trouble generating a summary. Please check the linked sources below or try again in a moment.",
      sources: chunks.map((chunk, i) => ({
        sourceIndex: i + 1,
        docId: chunk.docId,
        headingPath: chunk.headingPath,
        chunkIndex: chunk.chunkIndex,
        preview: chunk.chunkText.slice(0, 150) + (chunk.chunkText.length > 150 ? '…' : ''),
      })),
    };
  }
}

/**
 * POST /api/v1/rag/query
 * Body: { query: string }
 * Auth: required (verifyJWT set in routes)
 */
const ragQuery = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    throw new ApiError(400, 'query is required');
  }

  const result = await answerWithCitations(query.trim(), req.user._id.toString());

  return res.status(200).json(new ApiResponse(200, result, 'RAG response generated'));
});

export { ragQuery };
