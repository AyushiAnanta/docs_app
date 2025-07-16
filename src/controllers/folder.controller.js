import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Folder } from "../models/folder.model.js";
import { Doc } from "../models/doc.model.js";

// POST /api/folders - Create new folder
export const createFolder = asyncHandler(async (req, res) => {
  // TODO: Create a folder for the user

  const {name, parentFolder= "general"} = req.body
  
    if (!name || !parentFolder ) {
      throw new ApiError(400, "all fields are necessary")
    }
  
    const folder = await Folder.create(
        {
            owner: req.user?._id,
            name,
            parentFolder
        })
  
    return res.status(201).json(new ApiResponse(201, folder, "folder created successfully"))
});

// GET /api/folders - Get all folders for user
export const getAllFolders = asyncHandler(async (req, res) => {
  // TODO: Fetch all folders created by the user

  const folder = await Folder.aggregate([{
              $match: {
                  owner: new mongoose.Types.ObjectId(req.user._id) 
              }
          },
          {$sort: {createdAt: -1}}
      ])
  
      if (!folder) {
          throw new ApiError(404, "folders could not be fetched")
      }
  
      return res.status(200).json(new ApiResponse(200, folder, "folders fetched successfully"))
});

// DELETE /api/folders/:id - Delete folder
export const deleteFolder = asyncHandler(async (req, res) => {
  // TODO: Delete folder by ID (optionally with docs)

  try {
          const  folderId  = req.params.id
          const folder = await Folder.findByIdAndDelete(
              folderId)
          
              
          return res.status(200).json(new ApiResponse(200, null, "Folder Deleted Successfully"))
          
      } catch (error) {
          throw new ApiError(400, error)
      }
});

// PATCH /api/folders/:id - Rename folder
export const renameFolder = asyncHandler(async (req, res) => {
  // TODO: Change the name of the folder
  const folderId = req.params.id
  const {name} = req.body

  const folder = await Folder.findByIdAndUpdate(folderId,
    { $set: {
        name
    } },
    { new: true }
  )

    return res.status(200).json(new ApiResponse(200, folder, "folder renamed successfully"))

});

export const getFolderById = asyncHandler(async (req, res) => {
  const folderId = req.params.id;
  const { withDocs } = req.query;

  // Step 1: Check if folder exists and belongs to the user
  const folder = await Folder.findOne({
    _id: folderId,
    owner: req.user._id,
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  // Step 2: Optionally fetch documents inside this folder
  let docs = [];
  if (withDocs === "true") {
    docs = await Doc.find({
      folder: folderId,
      owner: req.user._id,
    }).sort({ createdAt: -1 });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      folder,
      docs: withDocs === "true" ? docs : undefined,
    }, "Folder fetched successfully")
  );
});


// DELETE /api/folders/:id?withDocs=true - Delete folder and all its docs
export const deleteFolderAndDocs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { withDocs } = req.query;

  // Step 1: Delete the folder
  const folder = await Folder.findByIdAndDelete(id);

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  // Step 2: If withDocs is true, delete associated docs
  if (withDocs === "true") {
    await Doc.deleteMany({ folder: id });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      `Folder deleted${withDocs === "true" ? " along with documents" : ""}`
    )
  );
});

// // GET /api/folders/search?q=... - Search folders by name
// export const searchFolders = asyncHandler(async (req, res) => {
//   // TODO: Search folders based on query string
// });

// // PATCH /api/folders/:id/move-docs - Move all docs to another folder
// export const moveDocsFromFolder = asyncHandler(async (req, res) => {
//   // TODO: Move all docs in current folder to new folder
// });
