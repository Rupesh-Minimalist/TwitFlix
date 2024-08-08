import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser=async(req,res)=>{

    const {username,email,fullName, passsword}=req.body

    // Validations:

    const fields=[username,email,fullName,passsword]
    const ValidFields=fields.every(field=>field.trim()!=="")

    if(!ValidFields){
        return res.status(400).json({
        error:"All Fields are required !"
        })
    }

    // If user Already exist:

    const existedUser=User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        return res.status(409).json({
            error:"Username or Email Already Exist"
        })
    }

    //Check for Images and Check for Avatar:

    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        return res.status(400).json({
            error:"Avatar is Required"
        })
    }

    const avatar=uploadOnCloudinary(avatarLocalPath)
    const coverImage=uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        return res.status(400).json({
            error:"Avatar is Required"
        })
    }

    // Create user

    const newUser=await User.create({
        fullName,
        username:username.toLowerCase(),
        email,
        passsword,
        avatar:avatar.url, // .url is returned by cloudinary
        coverImage:coverImage.url || ""
    })

    const createdUser=await User.findOne({_id:newUser._id}).select("-password -refreshToken")

    if(!createdUser){
        return res.status(500).json({
            error:"Something Broke while registering User"
        })
    }

    return res.status(200).json({
        message:"User Created Successfully !"
    })
}

export default registerUser