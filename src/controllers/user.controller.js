import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

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

    if(!email && !username ){

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
    const refreshToken=await existedUser.generateRefreshToken()

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

const refreshAccessToken=async(req,res)=>{

    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken // for different 

    if(!incomingRefreshToken){
        res.status(401).json({
            error:"Unathorised Request"
        })
    }

    try {
        let decoded_Token=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        let existedUser=await User.findById(decoded_Token._id)
        
        if(!existedUser){
            res.status(401).json({
                error:"Invalid Token"
            })
        }
    
        if(existedUser.refreshToken!==incomingRefreshToken){  
            res.status(401).json({
                error:"Refresh Token is expired or Used"
            })
        }
    
        const newAccessToken=await existedUser.generateAccessToken();
        const newRefreshToken=await existedUser.generateRefreshToken()
    
        existedUser.refreshToken=newRefreshToken
        await existedUser.save({validateBeforeSave:false})
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",newAccessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json({
            message:"Both Tokens Refreshed"
        })
    } catch (error) {
        return res
        .status(400)
        .json({
            error:"Something Went wronggg !"
        })
    }
}

const changeCurrentPassword=async(req,res)=>{   // user is loggedin

    const {oldPassword,newPassword}=req.body

    const existedUser=await User.findById(req.user._id)
    const iscorrect=existedUser.isPasswordCorrect(oldPassword)

    if(!iscorrect){
        return res.status(401).json({
            error:"Invalid Old Password"
        })
    }

    existedUser.password=newPassword            //used save not findOneAndUpdate b/c we have to run pre hook
    await existedUser.save({validateBeforeSave:false})

    return res
    .status(200)
    .json({
        message:"Password Changed !"
    })

}

const getCurrentUser=(req,res)=>{

    return res
    .status(200)
    .json({
        message:"User Fetched Succesfully"
    })
}

const updateAccountDetails=async(req,res)=>{
    const {email,fullName}=req.body

    if(!email || !fullName){
        return res
        .status(401)
        .json({
            error:"All Fields are required"
        })
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                email:email,
                fullName:fullName
            }
        },
        {new:true}
    ).select("-password")

    return res 
    .status(200)
    .json({
        message:"Details Updated !"
    })
}

const updateUserAvatar=async(req,res)=>{

    const newAvatarLocalPath=req.file.path //Beacuse upload.single

    if(!newAvatarLocalPath){
        return res
        .status(401)
        .json({
            error:"Avatar is required"
        })
    }

    const avatar=await uploadOnCloudinary(newAvatarLocalPath)
    
    if(!avatar.url){
        return res
        .status(401)
        .json({
            error:"Error while uploading to Cloudinary"
        })
    }

   await findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json({
        message:"Avatar updated Succesfully"
    })
}

const updateUserCoverImage=async(req,res)=>{

    const newCoverImageLocalPath=req.file.path //Beacuse upload.single

    if(!newCoverImageLocalPath){
        return res
        .status(401)
        .json({
            error:"Cover Image is required"
        })
    }

    const coverImage=await uploadOnCloudinary(newCoverImageLocalPath)
    
    if(!avatar.url){
        return res
        .status(401)
        .json({
            error:"Error while uploading to Cloudinary"
        })
    }

   await findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")


    return res
    .status(200)
    .json({
        message:"Cover Image updated Succesfully"
    })
}

const getUserChannelProfile=async(req,res)=>{

    const {username}=req.params

    if(!username?.trim()){
        return res.status(401).json({
            error:"Username is missing"
        })
    }

    // aggreation Pipeline:
    // TO FIND:
    // Sunscibers, Subscribed to, isSubscribed

    const channel= await User.aggregate([
        {
            $match:{      // just like find({})
                username:username
            }
        },
        {   
            $lookup:{                        // subcribers
                from:"subscriptions",         // Subscription==> subsciptions
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{                       //subscribedTo
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {                                   // adding this field to each userModel
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"   // counts
                },
                subscribedtoCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{                 // Condition
                        if:{ $in:[req.user._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false 
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscriberCount:1,
                subscribedtoCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ])

    if(!channel.length){                // channel is array of results
        return res.status(200).json({
            error:"Channel Unavailable"
        })
    }

    return res
    .status(200)
    .json({
        message:"User Fetched Succesfully"
    })

}

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile}