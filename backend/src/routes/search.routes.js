import express from 'express';
import { search } from '../controllers/search.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyJWT);

// POST /api/v1/search { query }
router.post('/', search);

export default router;
