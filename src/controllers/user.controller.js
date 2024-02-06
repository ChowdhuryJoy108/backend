import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty or email is correct

  // check user is already exists: username,email

  // check for images,check for avatar
  // upload them to cloudinary server : check avatar is uploaded or not
  // create user object - create entry in db
  // remove password refresh token field from response
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;
  if (
    // akta field jodi empty thake tahole true return kore dibe - tar mane user required field a data provide kore ni.
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // user already exist or not
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  // check if user already exist.
  if (existedUser) {
    throw new ApiError(409, "User already exists ");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // check if avatarlocalpath is exist
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  //pass localpath to uploadFileOnCloudinary for uploading on cloudinary

  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

  // check avatar file is uploaded in cloudinary
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!");
  }

  // user creation and  entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // check user created or not
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // if user not successfully  created
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  // response with ApiResponse

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

export { registerUser };









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
