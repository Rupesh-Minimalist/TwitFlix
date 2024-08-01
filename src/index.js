import connectDB from "./db/mongoose_connection.js";
// require("dotenv").config({path:"./env"})
import dotenv from "dotenv";

connectDB();
dotenv.config({path:"./env"})