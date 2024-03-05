import { Router } from "express";
import {
  registerUser,
  loginUser,
  LogOutUser,
  RefreshAccessToken,
} from "../controllers/User.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

// router.route('/register').post(registerUser) // this is one way but it is not working idk why
// router.route('/register').post((req,res,next)=>(

//     upload.fields([
//         {
//             name:"avatar",
//             maxCount:1
//         },
//         {
//             name:"coverImage",
//             maxCount:1
//         }
//     ]), // this is a middleware basically
//     registerUser(req,res,next)
// ))

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
  ]), // this is a middleware basically
  registerUser
);

// secured Routes
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, LogOutUser);
router.route("/refresh-token").post(RefreshAccessToken);

export default router;
