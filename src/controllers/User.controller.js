import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/User.model.js";
import { UploadOnCloudinary } from "../utils/Cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import Jwt from "jsonwebtoken";

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

  //multer hme files ka access deta hai , basically multer req me hi or feilds ko add kr deta hai
  const avtarLoacalPath = req.files?.avatar[0]?.path;
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

  const avatar = await UploadOnCloudinary(avtarLoacalPath); // we get object
  const coverImage = await UploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required field");
  }

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
    console.log("user before adding refresh token- ", user);
    await user.save({ validateBeforeSave: false });
    console.log("user after adding refresh token-", user);

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
      $set: {
        refreshToken: undefined, // data that we need to update
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
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised Request");
  }

  // incomingRefreshToken this is in a encoded form, so we are decoding this
  try {
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );

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
        200,
        {
          accesstoken,
          newrefreshtoken,
        },
        "Refresh Token Refreshed Successfully"
      );
  } catch (error) {
    throw new ApiError(401,"Invalid refrsh token")
  }
});

export { registerUser, loginUser, LogOutUser, RefreshAccessToken };
