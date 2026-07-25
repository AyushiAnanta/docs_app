import express from 'express';
import { ragQuery } from '../controllers/rag.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyJWT);

// POST /api/v1/rag/query { query }
router.post('/query', ragQuery);

export default router;
