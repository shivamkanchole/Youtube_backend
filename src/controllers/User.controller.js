import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/User.model.js";
import { UploadOnCloudinary } from "../utils/Cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  console.log("Request received at register function");
  // 'this are the steps(ALGORITHM) we need to do to REGISTER a user'
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email, and more as you want
  // check for images, check for avatar
  // upload them to cloudinary, avatar, coverimgs
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { username, FullName, email, password } = req.body;
  // console.log(username);

  if (
    [username, FullName, email, password].some((field) => field?.trim() === "") // it return true if feild is empty, some method only returns true or false
  ) {
    throw new ApiError(401, "All fields are rquired");
  }

  const userexisted = await User.findOne({
    $or: [{ email }, { username }], // we can use multiple thing using $ , here we are just find ki user multiple time to nhi hai by using two property just for extra security
  });
  if (userexisted) {
    throw new ApiError(409, "User with email|username is already existed");
  }

  console.log("user not registered");

  //multer hme files ka access deta hai , basically multer req me hi or feilds ko add kr deta hai
  const avtarLoacalPath = req.files?.avatar[0]?.path;
  console.log("hereok");
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; // this is a advance way to check
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    // this is a classical way to check for not required feilds
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avtarLoacalPath) {
    throw new ApiError(400, "Avatar is required field");
  }
  console.log("uploadinf on cloudninay");
  const avatar = await UploadOnCloudinary(avtarLoacalPath); // we get object
  const coverImage = await UploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required field");
  }
  console.log("uploaded on cloudninay");

  const user = await User.create({
    FullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // bydefault db me jab bhi koi add hota hai to db use ek id deta hai
  const createduser = await User.findById(user._id).select(
    // this is the syntex , jise hatana hai use select kro and then uske aage minus sign lga do
    "-password -refreshToken"
  );
  if (!createduser) {
    throw new ApiError(500, "Something went wrong while Registering a user");
  }
  console.log("we are sending data now");
  return res
    .status(201)
    .json(new apiResponse(200, createduser, "User Created Successfully"));
});

const GenerateAccessAndRefreshTokens = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshToken = refreshtoken;
    await user.save({ validateBeforeSave: false });

    return { accesstoken, refreshtoken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tokne "
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // extracting data from a body of login form
  // validating the data
  // then just check user existed in database or not
  // check for a password
  // also access and refresh token generate karo , also set the refresh token in user
  // then send this token using cookies

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username|Email is a required field");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(401, "User Not Registered");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(402, "Wrong Credentials");
  }

  const { accesstoken, refreshtoken } = await GenerateAccessAndRefreshTokens(
    user._id
  );

  // we are again fetching data of user becouse previous data does not have refresh token , thats why we need updated user
  const loggedinuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // whenever we send cookies we always design some option like this , so that no one can modified our cookies except on server
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accesstoken", accesstoken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedinuser,
          accesstoken,
          refreshtoken,
        },
        "User Logged In  Successfully"
      )
    );
});

const LogOutUser = asyncHandler(async (req, res) => {
  // also refreshtoken of there model should be removed
  // whenever we are going to logout a user , always remove there cookis

  await User.findByIdAndUpdate(
    req.user?._id, // query jisse user ko find krna hai
    {
      $unset: {
        refreshToken: 1, // data that we need to update
      },
    },
    {
      new: true, // whenever we need this user , we will get updated user
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(new apiResponse(200, {}, "User Logged out Successfully"));
});

const RefreshAccessToken = asyncHandler(async (req, res) => {
  // extract the refrsh token from body or cookies
  const incomingRefreshToken =
    req.cookies?.refreshtoken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised Request");
  }

  // incomingRefreshToken this is in a encoded form, so we are decoding this
  try {
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    // console.log("This is Decoded Refresh Token-",decodedToken)
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refreshtoken");
    }

    // we are matching the token which is from body or cookies with the token which is stored in our data base, and if both are same then we are just refresh the access token
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refreshtoken Expired or not used");
    }
    const { accesstoken, newrefreshtoken } =
      await GenerateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accesstoken", accesstoken, options)
      .cookie("refreshtoken", newrefreshtoken, options)
      .json(
        new apiResponse(
          200,
          {
            accesstoken,
            newrefreshtoken,
          },
          "Refresh Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

const ChangeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    return new ApiError(401, "Invalid old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user Fetched"));
});

const updateCurrentUserDetails = asyncHandler(async (req, res) => {
  const { FullName, email } = req.body
  // console.log(FullName);

  if (!(FullName && email)) {
    throw new ApiError(401, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        FullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "User Details Updated Successfully"));
});

const updateCurrentUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, "Local Fill Missing");
  }
  // console.log("File uploded locally")
  const avatar = await UploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, "avatar is not uploaded on Cloudinary");
  }
  // console.log("file uploaded on cloudinary")

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

  // TODO - we need to delete the file which is locally present in our public files...

  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar Updated Successfully"));
});

const updateCurrentUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;
  if (!CoverImageLocalPath) {
    throw new ApiError(401, "Local Fill Missing for Cover Image");
  }
  
  console.log("file uploaded locally")
  const coverImage = await UploadOnCloudinary(CoverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(500, "CoverImage is not uploaded on Cloudinary");
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

  return res.status(200).json(new apiResponse(200, user, "CoverImage Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // we have extracted username form url
  const { username } = req.params;
  // console.log(username)

  if (!username?.trim()) {
    throw new ApiError(401, "Username is missing");
  }

  // now we are using aggregation pipeline , {} inside this we write pipelines
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        // this function find ki mujhe kitno ne subscribe kr rkha hai
        from: "subscribtions", // here we take modelname - Subscribtion, but in db it becomes this - subscribtions
        localField: "_id",
        foreignField: "Channel",
        as: "Subscribers",
      },
    },
    {
      $lookup: {
        // and  this function find ki mene kitno ne subscribe kr rkha hai
        from: "subscribtions",
        localField: "_id",
        foreignField: "Subscriber",
        as: "SubscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$Subscribers",
        },
        channelSubscribedToCount: {
          $size: "$SubscribedTo",
        },
        issubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$Subscribers.Subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        FullName: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        issubscribed: 1,
        email: 1,
      },
    },
  ]);
  
  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists")
  }

  return res
    .status(200)
    .json(new apiResponse(200, channel[0], "channel Fetched Successfully"));
});

const getwatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
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
                    FullName: 1,
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

  console.log(user[0].watchHistory)
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "wartch Histor fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  LogOutUser,
  RefreshAccessToken,
  ChangeCurrentPassword,
  getCurrentUser,
  updateCurrentUserDetails,
  updateCurrentUserCoverImage,
  updateCurrentUserAvatar,
  getUserChannelProfile,
  getwatchHistory,
};
