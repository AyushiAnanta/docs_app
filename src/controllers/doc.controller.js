import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Doc } from "../models/doc.model.js";
import {Folder } from "../models/folder.model.js"
import mongoose from "mongoose"

// GET /api/docs - Get all user docs
const getAllDocs = asyncHandler(async (req, res) => {
  // TODO: Fetch all docs for the logged-in user

    const docs = await Doc.aggregate([{
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {$sort: {createdAt: -1}}
    ])

    if (!docs || docs.length === 0) {
        throw new ApiError(404,[], "documents could not be fetched")
    }

    return res.status(200).json(new ApiResponse(200, docs, "Docs fetched successfully"))
});

// POST /api/docs - Create new doc
const createDoc = asyncHandler(async (req, res) => {
  // TODO: Create a new document for the user

  const {title, content, folder= "general", tags, isPublic} = req.body

  if (!title || !content || !folder ) {
    throw new ApiError(400, "all fields are necessary")
  }

  const doc = await Doc.create(
      {
          owner: req.user?._id,
          title,
          content,
          folder,
          tags,
          isPublic
      })

  return res.status(201).json(new ApiResponse(201, doc, "doc created successfully"))


});

// GET /api/docs/:id - Get one doc
const getDocById = asyncHandler(async (req, res) => {
  // TODO: Fetch a single document by ID (if owner)

  const docId = req.params.id

  const checkdocId = await Doc.findById(docId)

  if (!checkdocId) {
    throw new ApiError(400, "couldnt find document")
  }

  return res.status(200).json(new ApiResponse(200, checkdocId, "doc fetched successfully"))
});

// PATCH /api/docs/:id - Update doc
const updateDoc = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;

  if (!title && !content && !tags) {
    throw new ApiError(400, "Send at least one field to update");
  }

  const updateFields = {};
  if (title) updateFields.title = title;
  if (content) updateFields.content = content;
  if (tags) updateFields.tags = tags;

  const updatedDoc = await Doc.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedDoc) {
    throw new ApiError(404, "Document not found or update failed");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedDoc, "Document updated successfully")
  );
});


// DELETE /api/docs/:id - Delete doc
const deleteDoc = asyncHandler(async (req, res) => {
  // TODO: Delete a document

    try {
        const  docId  = req.params.id
        const doc = await Doc.findByIdAndDelete(
            docId)
        
            
        return res.status(200).json(new ApiResponse(200, null, "Document Deleted Successfully"))
        
    } catch (error) {
        throw new ApiError(400, error)
    }
});

// PATCH /api/docs/:id/toggle-public - Toggle visibility
const toggleDocVisibility = asyncHandler(async (req, res) => {
  // TODO: Toggle isPublic field

  const docId = req.params.id
    const doc = await Doc.findById(docId)
    if (!doc) {
        throw new ApiError(404, "doc not found");
    }   

    const newStatus = !doc.isPublic;

    const docToggledPublish = await Doc.findByIdAndUpdate(docId,
        {
            $set: {
                isPublic: newStatus
            } 
        },{new: true}
    ) 


    return res.status(200).json(new ApiResponse(200, docToggledPublish, "Public button Toggled Successfully"))
});

// GET /api/docs/folder/:folderId - Docs in folder
const getDocsByFolder = asyncHandler(async (req, res) => {
  // TODO: Fetch all docs inside a given folder


  const docs = await Doc.aggregate([{
            $match: {
                folder: new mongoose.Types.ObjectId(req.params.folderId),
                owner: new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {$sort: {createdAt: -1}}
    ])

    if (!docs || docs.length === 0) {
        throw new ApiError(404,[], "documents could not be fetched")
    }

    return res.status(200).json(new ApiResponse(200, docs, "Docs fetched successfully"))

});

// // GET /api/docs/search?q=... - Search docs
//  const searchDocs = asyncHandler(async (req, res) => {
//   // TODO: Search by title or tag
// });

// // GET /api/docs/public - Get public docs
//  const getPublicDocs = asyncHandler(async (req, res) => {
//   // TODO: Fetch all public documents
// });

// // POST /api/docs/:id/duplicate - Clone doc (optional)
//  const duplicateDoc = asyncHandler(async (req, res) => {
//   // TODO: Duplicate document structure/content
// });

// PATCH /api/docs/:id/move - Move to another folder (optional)
 const moveDocToFolder = asyncHandler(async (req, res) => {
  // TODO: Change folder reference of the document

  const { id } = req.params;
  const { newFolder} = req.body;

  if (!newFolder) {
    throw new ApiError(400, "Mention folder to move to");
  }

  const folder = await Folder.findById(newFolder)

  if (!folder) {
    throw new ApiError(404, "folder does not exist");
  }
 
  const updatedDoc = await Doc.findByIdAndUpdate(
    id,
    { $set: {
      folder: newFolder}
    },
    { new: true }
  );

  if (!updatedDoc) {
    throw new ApiError(404, "Document not found or move failed");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedDoc, "Document moved successfully")
  );
});



export {
    getAllDocs,
    createDoc,
    getDocById,
    updateDoc,
    deleteDoc,
    toggleDocVisibility,
    getDocsByFolder
}