import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

  const avatarLocalPath = req.files?.avatar[0]?.path; // required field

  let coverImageLocalPath; // its an optional field

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
  // find the user input compare with database : fields is password correct or not
  // generate access and refresh token for user.
  // send cookies
  // success response

  const { username, email, password } = req.body;

  // username and email one must be provided
  if (!username && !email) {
    throw new ApiError(400, "usernamme and email is required");
  }

  //if you want to login with one of (username or email the do this - if(!(username||email)))

  // find whether the user with this username and email is registered or not.
  const registeredUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  //if user is not registered then throw an error.

  if (!registeredUser) {
    throw new ApiError(404, "user does not exist. please register!");
  }

  // password check : returns true/false

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

  // By default cookies can be modified in frontend to prevent that we can set httpOnly and secure property to true inside options object. it can only be modified in server.

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

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // This mongoDB operator removes the field from the document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // if is one more checking input
  // const {oldPassword, newPassword,confirmPassword} = req.body

  // if (!(newPassword === confirmPassword)) {
  //   throw new ApiError(400,"The confirmation password does not match the new Password. please try again")
  // }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // user password property set
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  console.log(req.user._id)
  const user = await User.findById(req.user?._id).select("-password -refreshToken")
  console.log(user)
  if(!user){
      throw new ApiError(401,"User not found")
    }
  return res
    .status(200)
    .json(new ApiResponse(200, {user:user}, "Current user fetched successfully"));

  // this will work same as well

  // const user = User.findById(req.user?._id)

  // if(!user){
  //   throw new ApiError(401,"User not found")
  // }

  // return res.status(200)
  // .json(new ApiResponse(
  //   200,
  //   {user: user},
  //   "Current user fetched successfully"
  // ))
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName,email} = req.body;
  if (!(fullName||email)) {
    throw new ApiError(400, "All fields are required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account Details updated!"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadFileOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User's Avatar updated successfully!"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User's cover image updated successfully! ")
    );
});

const getUserchannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  // aggregation pipeline
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    // to find out subscriber through channel
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    //to find out "I am subscribed to" through subscriber
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
  .status(200)
  .json(new ApiResponse(200, user[0]?.watchHistory, "Watch History fetched successfully"))
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserchannelProfile,
  getWatchHistory,
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
