import mongoose, {Schema} from "mongoose";

const fileSchema = new Schema(
    {
        document: {
            type: Schema.Types.ObjectId,
            ref: "Doc",
            required: true
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        filename: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
        
    },{timestamps: true}
)

export const File = mongoose.model("File", fileSchema)