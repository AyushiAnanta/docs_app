import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccesssToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, getUserById } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(upload.single("avatar"),registerUser)

router.route("/login").post(loginUser)

// secured routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccesssToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/c/:userId").get(getUserById)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)


export default router
