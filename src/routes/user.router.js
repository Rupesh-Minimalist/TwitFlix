import express from "express";
import { registerUser, loginUser, logoutUser} from "../controllers/user.controller.js";
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

router.route("/logout").get(isLoggedIn,logoutUser)

export default router