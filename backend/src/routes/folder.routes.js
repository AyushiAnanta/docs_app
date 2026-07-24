import { Router } from "express";
import {
  createFolder,
  getAllFolders,
  deleteFolder,
  renameFolder,
  getFolderById,
  deleteFolderAndDocs,
  // searchFolders,
  // moveDocsFromFolder
} from "../controllers/folder.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes below are protected
router.use(verifyJWT);

router.route("/")
  .post(createFolder)         // Create folder
  .get(getAllFolders);        // Get all folders

router.route("/:id")
  .get(getFolderById)         // Get one folder (with docs optionally via ?withDocs=true)
  .patch(renameFolder)        // Rename folder
  .delete(deleteFolderAndDocs); // Delete folder (optionally with docs)


// Uncomment these when implemented:

// router.route("/search").get(searchFolders); // Search folders by name
// router.route("/:id/move-docs").patch(moveDocsFromFolder); // Move all docs to another folder

export default router;
