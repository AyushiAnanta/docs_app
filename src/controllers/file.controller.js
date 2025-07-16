
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { File } from "../models/file.model.js";
import { Doc } from "../models/doc.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// POST /api/files/:docId - Upload a file to a specific document
// POST /api/files/:docId - Upload a file to a specific document
export const uploadFile = asyncHandler(async (req, res) => {
  const { docId } = req.params;
  const { filename } = req.body;
  const localFilePath = req.file?.path;

  if (!filename) {
    throw new ApiError(400, "Filename is required");
  }

  if (!localFilePath) {
    throw new ApiError(400, "No file uploaded");
  }

  // Upload to Cloudinary (or any service)
  const uploaded = await uploadOnCloudinary(localFilePath);

  if (!uploaded || !uploaded.url) {
    throw new ApiError(500, "File upload failed");
  }

  // Save file metadata
  const file = await File.create({
    document: docId,
    uploadedBy: req.user._id,
    filename,
    url: uploaded.url,
  });

  if (!file) {
    throw new ApiError(500, "Failed to save file metadata");
  }

  return res.status(201).json(
    new ApiResponse(201, file, "File uploaded and saved successfully")
  );
});


// GET /api/files/:docId - Get all files associated with a document
export const getFilesForDoc = asyncHandler(async (req, res) => {
  // TODO: Return all files for a given document
  const { docId } = req.params;

  const files = await File.find({
    document: docId,
    uploadedBy: req.user._id
  }).sort({ createdAt: -1 })

  if (!files) {
    throw new ApiError(400, "error in fetching files")
  }

  return res.status(200).json(new ApiResponse(200, files, "all files fetched successfully"))
});

// GET /api/files/ - Get all files associated with a User
export const getFilesForUser = asyncHandler(async (req, res) => {
  // TODO: Return all files for a given document

  const files = await File.find({
    uploadedBy: req.user._id}).sort({ createdAt: -1 })

  if (!files) {
    throw new ApiError(400, "error in fetching files")
  }

  return res.status(200).json(new ApiResponse(200, files, "all files fetched successfully"))
});

// GET /api/files/file/:fileId - Get metadata/details of a specific file
export const getFileById = asyncHandler(async (req, res) => {
  // TODO: Return metadata of a single file by ID
  const { fileId } = req.params;

  const file = await File.findById(fileId)

  if (!file) {
    throw new ApiError(400, "error in fetching files")
  }

  return res.status(200).json(new ApiResponse(200, file, "all files fetched successfully"))
});

// DELETE /api/files/file/:fileId - Delete a specific file
export const deleteFileById = asyncHandler(async (req, res) => {
  // TODO: Delete file metadata and actual file (local/cloud)
  const { fileId } = req.params;

  const file = await File.findByIdAndDelete(fileId)

  if (!file) {
    throw new ApiError(400, "error in deleting file")
  }

  return res.status(200).json(new ApiResponse(200, "file deleted successfully"))
});

// DELETE /api/files/:docId - Delete all files associated with a document
export const deleteAllFilesOfDoc = asyncHandler(async (req, res) => {
  // TODO: Bulk delete files linked to a document
  const { docId } = req.params;

  const file = await File.deleteMany({document: docId})

  if (!file) {
    throw new ApiError(400, "error in deleting files")
  }

  return res.status(200).json(new ApiResponse(200, "files deleted successfully"))
});
