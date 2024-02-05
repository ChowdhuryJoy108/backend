import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (req,res)=>{
    res.status(200).json({
        message : 'ok'
    })
})

export {registerUser}




// another way 

// const registerUser = async (req,res,next)=>{
//    try{
//         res.status(200).json({
//             message : 'ok'
//         })
//    }catch(error){
//     next(error)
//    }
// }

// export {registerUser}


