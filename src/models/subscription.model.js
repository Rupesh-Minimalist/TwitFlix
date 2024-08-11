import mongoose from "mongoose";

const subscriptionSchema=new mongoose.Schema({

    subsciber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,  // channel is also a user
        ref:"User"
    }

},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)