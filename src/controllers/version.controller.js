// controllers/version.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Version } from "../models/version.model.js";
import { Doc } from "../models/doc.model.js";

// POST /api/versions/:docId - Create a new version
export const createVersion = asyncHandler(async (req, res) => {
  // TODO: Save a snapshot of the document content

  const { docId } = req.params
  const { content } = req.body

  if (!content) {
    throw new ApiError(400,"content is needed")
  }

    const document = await Doc.findOne({_id: docId,owner: req.user._id});

  if (!document) {
    throw new ApiError(400,"document does not exist or unauthorized")
  }

  const version = await Version.create(
    {
        content,
        document: docId,
        createdBy:req.user?._id
    }
  )

  return res.status(201).json(new ApiResponse(201,version," version created successfully"))


});

// GET /api/versions/:docId - Get all versions for a document
export const getVersionsForDoc = asyncHandler(async (req, res) => {
  // TODO: Fetch all versions for a given document
  const { docId } = req.params

  const document = await Doc.findOne({_id: docId,owner: req.user._id});

  if (!document) {
    throw new ApiError(400,"document does not exist or unauthorized")
  }

  const versions = await Version.find(
    {
        document: docId,
        createdBy: req.user._id
    }
  ).sort({ createdAt: -1 })

  return res.status(200).json(new ApiResponse(200, versions, "all versions fetched successfully"))
});

// GET /api/versions/version/:versionId - Get a specific version by ID
export const getVersionById = asyncHandler(async (req, res) => {
  // TODO: Return a specific version by ID

  const { versionId }  = req.params

  const version = await Version.findById(versionId)

    if (!version) {
    throw new ApiError(404, "Version not found or unauthorized");
  }


    return res.status(200).json(new ApiResponse(200, version, "version fetched successfully"))

});

// DELETE /api/versions/version/:versionId - Delete a specific version
export const deleteVersionById = asyncHandler(async (req, res) => {
  // TODO: Delete a single version from DB

  try {
    const { versionId }  = req.params
  
    const version = await Version.findByIdAndDelete(versionId)
  
    return res.status(200).json(new ApiResponse(200, null, "version Deleted Successfully"))
  } catch (error) {
    throw new ApiError(400, error)
  }
});

// PATCH /api/versions/version/:versionId/restore - Restore a version
// PATCH /api/versions/version/:versionId/restore - Restore a document from a version
export const restoreVersion = asyncHandler(async (req, res) => {
  const { versionId } = req.params;

  // Step 1: Find the version
  const version = await Version.findById(versionId);
  if (!version) {
    throw new ApiError(404, "Version not found");
  }

  // Step 2: Ensure the user owns the document associated with the version
  const document = await Doc.findOne({
    _id: version.document,
    owner: req.user._id,
  });

  if (!document) {
    throw new ApiError(403, "You are not authorized to restore this document");
  }

  // Step 3: Restore the document content
  document.content = version.content;
  await document.save();

  return res
    .status(200)
    .json(new ApiResponse(200, document, "Document restored to selected version"));
});


// DELETE /api/versions/:docId - Delete all versions of a document
export const deleteAllVersionsOfDoc = asyncHandler(async (req, res) => {
  // TODO: Delete all versions associated with a document

  const { docId } = req.params

  const doc = await Doc.findOne({_id: docId,owner: req.user._id});

  if (!doc) {
    throw new ApiError(400,"document does not exist or unauthorized")
  }

  await Version.deleteMany({document: docId})

  return res.status(200).json(new ApiResponse(200,null,"all version of the doc deleted successfully"))
});

// GET /api/versions/:docId/latest - Get the latest version
export const getLatestVersion = asyncHandler(async (req, res) => {
  const { docId } = req.params;

  // Ensure the user owns the document
  const doc = await Doc.findOne({ _id: docId, owner: req.user._id });

  if (!doc) {
    throw new ApiError(404, "Document not found or unauthorized access");
  }

  // Find the latest version
  const latestVersion = await Version.findOne({
    document: docId,
    createdBy: req.user._id
  }).sort({ createdAt: -1 });

  if (!latestVersion) {
    throw new ApiError(404, "No versions found for this document");
  }

  return res.status(200).json(
    new ApiResponse(200, latestVersion, "Latest version fetched successfully")
  );
});
