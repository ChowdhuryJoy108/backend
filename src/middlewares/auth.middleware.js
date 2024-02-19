import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
// if needed 
import dotenv from 'dotenv'
dotenv.config()

import {User} from '../models/user.model.js'



export const verifyJWT = asyncHandler(async(req,res,next)=>{

   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
    //  console.log("MToken" , token)
     if(!token){
         throw new ApiError(401, "Unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    //  console.log("MDecodedToken" , decodedToken)
     
     const user = User.findById(decodedToken._id).select("-password -refreshToken")

    //  console.log("Muser" , user)

 
     if(!user){
         throw new ApiError(401, "Invalid Access Token")
     }
     
     req.user = user
 
     next()
 
   }catch(error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
   }
  
})