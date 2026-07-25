import express from 'express';
import {
  getAllDocs,
  createDoc,
  getDocById,
  updateDoc,
  deleteDoc,
  toggleDocVisibility,
  getDocsByFolder,
  getSharedDocById,
  importDoc,
} from '../controllers/doc.controller.js';

import { verifyJWT } from '../middlewares/auth.middleware.js';
import { memoryUpload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// Public route - get shared document
router.get('/shared/:id', getSharedDocById);

// Apply JWT middleware to all other doc routes
router.use(verifyJWT);

// /api/docs/
router.route('/')
  .get(getAllDocs)        // GET all docs done
  .post(createDoc);       // Create new doc done

// POST /api/docs/import - File import endpoint
router.post('/import', memoryUpload.single('file'), importDoc);

// /api/docs/:id
router.route('/:id')
  .get(getDocById)        // Get single doc done
  .patch(updateDoc)       // Update title/content/tags done
  .delete(deleteDoc);     // Delete doc

// Toggle public visibility
router.patch('/:id/toggle-public', toggleDocVisibility); //done

// Docs by folder
router.get('/folder/:folderId', getDocsByFolder); // done

// Future routes (optional)
// router.get('/search', searchDocs);
// router.get('/public', getPublicDocs);
// router.post('/:id/duplicate', duplicateDoc);
// router.patch('/:id/move', moveDocToFolder);

export default router;
