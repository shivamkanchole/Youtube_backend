import { User } from "../models/User.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";
// this function is basically give us token and from that token we are going to find user details and used for logout and other things
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const Token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer ", ""); // we ahve access of cookies in req, or we can extract from a header -> Authorization: Bearer <Token>
    if (!Token) {
      throw new ApiError(401, "Unauthorised Token");
    }

    // now we can verifying the tokens with secret key using JWT
    const decodedToken = Jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      402,
      error?.message || "JWTverifyer function is not working"
    );
  }
});

export { verifyJWT };
