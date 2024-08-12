import express from "express";
import { registerUser,
    loginUser, 
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { isLoggedIn } from "../middlewares/isloggedIn.js";

const router=express.Router()
router.route("/register").post(
    upload.fields([    // for multiple images
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)
router.route("/login").post(loginUser)    
router.route("/logout").post(isLoggedIn,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(isLoggedIn,changeCurrentPassword)
router.route("/get-current-user").get(isLoggedIn,getCurrentUser)
router.route("/update-account-details").patch(isLoggedIn,updateAccountDetails)  //.patch 
router.route("/update-user-avatar").patch(isLoggedIn,upload.single("avatar"),updateUserAvatar)
router.route("/update-user-coverImage").patch(isLoggedIn,upload.single("coverImage"),updateUserCoverImage)
router.route("/channel/:username").get(isLoggedIn,getUserChannelProfile)



export default router