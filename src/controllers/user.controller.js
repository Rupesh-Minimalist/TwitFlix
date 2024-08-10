import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser=async(req,res)=>{

    const {username,email,fullName, password}=req.body

    // Validations:

    const fields=[username,email,fullName,password]
    const ValidFields=fields.every(field=>field.trim()!=="")

    if(!ValidFields){
        return res.status(400).json({
        error:"All Fields are required !"
        })
    }

    // If user Already exist:

    const existedUser=await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        return res.status(409).json({
            error:"Username or Email Already Exist !!"
        })
    }

    //Check for Images and Check for Avatar:

    const avatarLocalPath=req.files?.avatar[0]?.path
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files?.coverImage.length>0){
         coverImageLocalPath=req.files?.coverImage[0]?.path
    } // Special check if coverimage is not sent
    
    if(!avatarLocalPath){
        return res.status(400).json({
            error:"Avatar is Required"
        })
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

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
        password,
        avatar:avatar?.url , // .url is returned by cloudinary
        coverImage:coverImage?.url || ""
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

const loginUser=async(req,res)=>{
    
    const {email,username,password}=req.body

    // Validations:

    if(!email || !username ){

        return res.status(400).json({
            error:"Email or username is Required !"
        })
    }

    // Find user

    let existedUser=await User.findOne({
        $or:[{email},{username}]
    })

    if(!existedUser){
        return res.status(404).json({
            error:"Account Doesn't Exist, Register First ! "
        })
    }

    //Password check

    const isPasswordValid=await existedUser.isPasswordCorrect(password)

    if(!isPasswordValid){
        return res.status(401).json({
            error:"Invalid Username or Password"
        })
    }

    // Generate AccessToken and RefreshToken

    const accessToken=await existedUser.generateAccessToken()
    const refreshToken=await existedUser.generateAccessToken()

    existedUser.refreshToken=refreshToken
    await existedUser.save({validateBeforeSave:false})

    //Saving cookie

    const options={    // so that cookie cant be edited
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json({
        message:"Logged in Succesfully !"
    })

}

const logoutUser=async(req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,           // isloggedin
        {
            $set:{
                refreshToken:undefined
            }
        },
        {new:true}
    ) 

    const options={    // so that cookie cant be edited
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({
        message:"Logged out Successfully"
    })

}


export {registerUser, loginUser, logoutUser}