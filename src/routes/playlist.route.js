import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/create-playlist").post(verifyJWT, createPlaylist);
router.route("/user-playlist/:userId").get(getUserPlaylists);
router.route("/playlist/:playlistId").get(getPlaylistById);
router
  .route("/addvideoToplaylist/:playlistId/:videoId")
  .post(addVideoToPlaylist);
router
  .route("/removeToplaylist/:playlistId/:videoId")
  .patch(verifyJWT, removeVideoFromPlaylist);
router.route("/removeplaylist/:playlistId").delete(verifyJWT, deletePlaylist);
router.route("/updateplaylist/:playlistId").patch(verifyJWT, updatePlaylist);

export default router;
