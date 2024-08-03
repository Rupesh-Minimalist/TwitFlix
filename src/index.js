import { app } from "./app.js";
import connectDB from "./db/mongoose_connection.js";
import dotenv from "dotenv"; // experimental

connectDB();

app.listen(process.env.PORT,()=>{
    console.log("Port is running at",process.env.PORT)
})

dotenv.config({path:"./env"})