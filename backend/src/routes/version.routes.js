import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createVersion,
  getVersionsForDoc,
  getVersionById,
  deleteVersionById,
  restoreVersion,
  deleteAllVersionsOfDoc,
  getLatestVersion
} from "../controllers/version.controller.js";

const router = Router();

// Protected routes (all require JWT)
router.use(verifyJWT);

// Create a new version of a document
router.post("/:docId", createVersion);

// Get all versions for a document
router.get("/:docId", getVersionsForDoc);

// Get the latest version of a document
router.get("/:docId/latest", getLatestVersion);

// Delete all versions of a document
router.delete("/:docId", deleteAllVersionsOfDoc);

// Get a specific version by ID
router.get("/version/:versionId", getVersionById);

// Delete a specific version
router.delete("/version/:versionId", deleteVersionById);

// Restore document from a specific version
router.patch("/version/:versionId/restore", restoreVersion);

export default router;
