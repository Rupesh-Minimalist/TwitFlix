import express from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";

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

export default router