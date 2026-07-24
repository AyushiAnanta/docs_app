import mongoose, {Schema} from "mongoose";

const versionSchema = new Schema(
    {
        content: {
            type: Object,
            required: true
        },
        document: {
            type: Schema.Types.ObjectId,
            ref: "Doc",
            required: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
    },{timestamps: true}
)

export const Version = mongoose.model("Version", versionSchema)