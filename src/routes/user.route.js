import { Router } from "express";
import {
  registerUser,
  loginUser,
  LogOutUser,
  RefreshAccessToken,
  ChangeCurrentPassword,
  getCurrentUser,
  updateCurrentUserDetails,
  updateCurrentUserAvatar,
  updateCurrentUserCoverImage,
  getUserChannelProfile,
  getwatchHistory,
} from "../controllers/User.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), // this is a middleware
  registerUser
);

// secured Routes
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, LogOutUser);
router.route("/refresh-accesstoken").post(RefreshAccessToken);
router.route("/change-password").post(verifyJWT, ChangeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/updateuser-details").patch(verifyJWT, updateCurrentUserDetails); // patch is used when we need to update some selected fields
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateCurrentUserAvatar);
router
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateCurrentUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").get(verifyJWT, getwatchHistory);

export default router;
