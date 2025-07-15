import mongoose, {Schema} from "mongoose";

const folderSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        parentFolder: {
            type: Schema.Types.ObjectId,
            ref: "Folder"
        },
        name: {
            type: String,
            required: true
        }
    },{timestamps: true}
)

export const Folder = mongoose.model("Folder", folderSchema)