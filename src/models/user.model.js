import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // for searching performance
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true } 
);

//mongoose pre hook-methods- save/valid/delete/update
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// custom methods

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password); // returns true if password is correct or false otherwise
};

// ANOTHER CUSTOM METHODS INJECTING IN USERSCHEMA

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    //PAYLOADS
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    //TOKEN SECRET 
    process.env.ACCESS_TOKEN_SECRET,

    // TOKEN EXPIRY TIME
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// ANOTHER METHODS INJECTING IN USERSCHEMA

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { 
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
    }
  );
};

export const User = mongoose.model("User", userSchema);
