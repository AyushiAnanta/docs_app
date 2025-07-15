import mongoose, {Schema} from "mongoose";


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercae: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercae: true,
            trim: true
        },
        avatar: {
            type: String,  //cloudinary url
            required: true
        },
        password: {
            type: String,
            required: [true, 'Password is Required']
        },
        refreshToken: {
            type: String
        }

    },{timestamps: true}
)


export const User = mongoose.model("User", userSchema)