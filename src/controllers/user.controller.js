import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userID) => {
  const user = await User.findById(userID); // finding user with mongo generated _id
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false }); // before save - validation : false

  return { accessToken, refreshToken };
};

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

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

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
    coverImage: coverImage?.url || "",
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

const loginUser = asyncHandler(async (req, res) => {
  // Algorithm
  // user input : username, email, password from req.body
  // find the user input compare with database : fields
  // generate access and refresh token for user.
  // send cookies
  // success response

  const { username, email, password } = req.body;

  // username and email one must be provided
  if (!username && !email) {
    throw new ApiError(400, "usernamme or email is required");
  }

  //if you want to login with one of (username or email the do this - if(!(username||email)))

  // find whether the user with this username and email is registered or not.
  const registeredUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  //if user is not registered then throw an error.

  if (!registeredUser) {
    throw new ApiError(404, "user does not exist");
  }

  // password check

  const isPasswordValid = await registeredUser.isPasswordCorrect(password);

  // if password is not valid then throwing an error.

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // generating tokens

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    registeredUser._id
  );

  const loggedInUser = await User.findById(registeredUser._id).select(
    "-password -refreshToken"
  );

  // By default cookies can be modified in frontend to prevent that we can set httpOnly and secure property to true inside options object. it can only modify in server.

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) =>{
   
    
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset:{
          refreshToken: 1
        }
      },
      {
        new: true,
      }
    )

   const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "User Logged Out"
     )
   )
});

export { 
  registerUser,
   loginUser, 
   logoutUser 
  };














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
