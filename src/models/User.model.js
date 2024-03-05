import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";

const userschema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    FullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      type: String, // we are using cloudnary url
      required: true,
    },
    coverImage: {
      type: String // from cloundnary url
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
      },
    ],
    refreshToken: {
      type: String
    },
  },
  { timestamps: true }
);

// this code is for encription of your password using mongoose middleware (pre)
// we are not using arrow function because use this ka refresh nhi milta hai , use uska context nhi pta hota hai
userschema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//this code is for deencription
// using this "METHODS" basically we are adding methods in our userschema
userschema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password); // firstone is clear text password and second one is encripted password from data base we can access it by this also it returns true and false
};

// now we are genrating access tokens
userschema.methods.generateAccessToken = function () {
  // Jwt.sign({payload},accesstoken,{expiryaccesstoken}) // this is a syntex for generating tokens
   return Jwt.sign(
   {
    _id: this._id, // here id(everything) is coming from database,
    email: this.email,
    username: this.username,
    FullName: this.FullName
   },
   process.env.ACCESS_TOKEN_SECRET,
   {
    expiresIn : process.env.ACCESS_TOKEN_EXPIRY
   }
  );
};

// now we are genrating refresh token
userschema.methods.generateRefreshToken = function () {
    // Jwt.sign({payload},refreshtoken,{expiryrefreshtoken}) // this is a syntex for generating tokens
    return Jwt.sign(
     {
      _id: this._id // here payload has less information
     },
     process.env.REFRESH_TOKEN_SECRET,
     {
      expiresIn : process.env.REFRESH_TOKEN_EXPIRY
     }
    );
  };


export const User = mongoose.model("User", userschema);
