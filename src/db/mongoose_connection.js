import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        console.log(`DB connected Succesfully ! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("DB Connection Failed :",error)
        process.exit(1) // cancels the process
    }
}

export default connectDB;