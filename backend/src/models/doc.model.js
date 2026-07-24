import mongoose, {Schema} from "mongoose";

const docSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: Object,
            required: true
        },
        folder: {
            type: Schema.Types.ObjectId,
            ref: "Folder",
            required: true
        },
        tags: [
            {
                type: String
            }
        ],
        isPublic: {
            type: Boolean,
            default: false
        }
        
    },{timestamps: true}
)

export const Doc = mongoose.model("Doc", docSchema)