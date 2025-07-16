import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, error, "something went wrong while generationg access and refresh tokens")
    }
}
const registerUser = asyncHandler( async (req, res) => {
    //naam lenge , saara information lenge, 
    //agar photo hai to usko cloudinary
    //mein multer ke through bhejwange 
    //saari cheeze db mein bejwaenge db se confirmation 
    //leke haa kar denge

    // get user details from frontend 
    // validation - not empty 
    // check if user already exist(username and email) 
    // check for images, check for avatar 
    // upload them to cloudinary, avatar
    // create user object - create entry in db (mongodb is no sql toh object banega)
    // remove password and refresh token feild from response
    // check for user creation
    // return response

    const{email, username, password } = req.body
    console.log("req body ", req.body);

    if (
        [ email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are req")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "user with same email or username already exists")
    }

    const avatarLocalPath = req.file?.path;
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar fields are req")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar fields are req")
    }

    const user = await User.create(
        {
            avatar: avatar.url,
            email,
            password,
            username: username.toLowerCase()
        }
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registration")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


const loginUser = asyncHandler(async (req, res) =>{

    // get user details from frontend 
    // validation - not empty 
    // check user exists-username/email
    // authenticate - password
    // give access and refresh token

    // req body -> data
    // username or email
    // find the user
    // password check
    // acess and refresh token
    // send cookie

    const{email, username, password } = req.body
    
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
        
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "incorrect password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user :loggedInUser, accessToken, refreshToken
        })
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, 
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"))
})

const refreshAccesssToken = asyncHandler(async (req, res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unautharized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const getUserById = asyncHandler(async(req, res) => {
    const {userId} = req.params
    const checkUserId = await User.findById(userId)
    
    if (!checkUserId) {
        throw new ApiError(400, "user not found")
    }
    
        return res.status(200).json(new ApiResponse(200, checkUserId , "user found successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {email} = req.body

    if (!email) {
        throw new ApiError(400, "all fields are required")
        
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set: {
            email
        }
    },
    {new: true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "account details are updated"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated"))


})

export  { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccesssToken,
    changeCurrentPassword,
    getCurrentUser,
    getUserById,
    updateAccountDetails,
    updateUserAvatar
    }