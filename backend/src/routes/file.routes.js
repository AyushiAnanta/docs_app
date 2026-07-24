
// routes/file.routes.js

import { Router } from "express";
import {
  uploadFile,
  getFilesForDoc,
  getFilesForUser,
  getFileById,
  deleteFileById,
  deleteAllFilesOfDoc
} from "../controllers/file.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected routes
router.post("/:docId", verifyJWT, upload.single("file"), uploadFile);
router.get("/:docId", verifyJWT, getFilesForDoc);
router.get("/", verifyJWT, getFilesForUser);
router.get("/file/:fileId", verifyJWT, getFileById);
router.delete("/file/:fileId", verifyJWT, deleteFileById);
router.delete("/:docId", verifyJWT, deleteAllFilesOfDoc);

export default router;
