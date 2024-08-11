import express from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken} from "../controllers/user.controller.js";
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

export default router