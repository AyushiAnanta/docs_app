import mongoose, { Schema } from 'mongoose';
import { EMBEDDING_DIMS } from '../utils/embedder.js';

const embeddingSchema = new Schema(
  {
    docId: {
      type: Schema.Types.ObjectId,
      ref: 'Doc',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    headingPath: {
      type: String,
      default: '(Introduction)',
    },
    chunkText: {
      type: String,
      required: true,
    },
    chunkHash: {
      type: String,
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    isCode: {
      type: Boolean,
      default: false,
    },
    // 3072-dimensional vector for Gemini gemini-embedding-2
    vector: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => v.length === EMBEDDING_DIMS,
        message: `Vector must have exactly ${EMBEDDING_DIMS} dimensions`,
      },
    },
  },
  { timestamps: true }
);

// Compound index for efficient upsert by docId + chunkIndex
embeddingSchema.index({ docId: 1, chunkIndex: 1 }, { unique: true });

// Text index on chunkText for the keyword leg of hybrid search
embeddingSchema.index({ chunkText: 'text' });

export const Embedding = mongoose.model('Embedding', embeddingSchema);
