import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

const isLoggedIn=async(req,res,next)=>{

    const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // for mobile

    
    if(!token){
        res.status(400).json({
            error:"Unauthorised request"
        })
    }
    else{

        let decoded_data=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        let loggedin_user=await User.findById(decoded_data._id).select("-password -refreshToken")

        if(!loggedin_user){
            return res.status(400).json({
                error:"Invalid Token"
            })
        }

        req.user=loggedin_user

        next()
    }
}

export {isLoggedIn}