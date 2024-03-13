import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/Playlist.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.model.js";
import { Video } from "../models/Video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { playlistname, playlistdescription } = req.body;
  console.log(playlistname, playlistdescription);
  if (!(playlistname && playlistdescription)) {
    throw new ApiError(
      400,
      "playlist and playlistdescription is a required field"
    );
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "Owner not found while creating playlist");
  }

  const playlist = await Playlist.create({
    playlistname,
    playlistdescription,
    owner: user._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Server error , Playlist not created");
  }
  console.log(playlist);

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist Created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;
  console.log(userId);
  if (!userId) {
    throw new ApiError(400, "userId is a required field");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "user not found at time of geting playlist");
  }

  const userplaylist = await Playlist.aggregate([
    {
      $match: {
        owner: user._id,
      },
    },
  ]);

  if (!userplaylist) {
    throw new ApiError(402, "NO playlist found with this userId");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, userplaylist, "Userplaylist fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;
  console.log(playlistId);
  if (!playlistId) {
    throw new ApiError(400, "PlaylistId not found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(402, "No playlist exist with this playlistid");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        playlist,
        "Playlist with playlistId fetched successfully"
      )
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  console.log(playlistId, videoId);
  if (!(playlistId && videoId)) {
    throw new ApiError(400, "playlistId and videoId is a required field");
  }

  const playlist = await Playlist.findById(playlistId);
  console.log(playlist.videos);
  if (!playlist) {
    throw new ApiError(401, "playlist not exist with this playlistId");
  }
  playlist.videos.push(videoId);
  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new apiResponse(200, playlist, "Video Added to Playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;
  console.log(playlistId, videoId);
  if (!(playlistId && videoId)) {
    throw new ApiError(
      401,
      "PlaylistId and videoId is a required field at removevideofrom playlist funtion"
    );
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (playlist.owner.equals(req.user?._id.toString())) {
      if (playlist.videos.length <= 0) {
        return res
          .status(200)
          .json(new apiResponse(200, playlist, "Playlist is empty"));
      }
      await playlist.videos.pop(videoId);
      await playlist.save({ validateBeforeSave: false });

      return res
        .status(200)
        .json(
          new apiResponse(
            200,
            playlist,
            "Video Removed from playlist successfully"
          )
        );
    } else {
      throw new ApiError(401, "You are not owner , cant delete");
    }
  } catch (error) {
    throw new ApiError(
      500,
      "Server Error , Something went wrong while removing the video from playlist"
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(
      401,
      "playlistId not found at time of deletion of playlist"
    );
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return res
      .status(200)
      .json(new apiResponse(200, playlist, "Playlist Not found"));
  }

  if (playlist.owner.equals(req.user?._id.toString())) {
    await Playlist.findByIdAndDelete(playlistId);

    return res
      .status(200)
      .json(new apiResponse(200, playlist, "Playlist Deleted Successfully"));
  } else {
    throw new ApiError(401, "You are not owner , cant delete");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  const { playlistname, playlistdescription } = req.body;
  console.log(playlistId, playlistname, playlistdescription);
  if (!(playlistId && playlistname && playlistdescription)) {
    throw new ApiError(
      400,
      "All fields are Required at a time of updating a playlist"
    );
  }

  const playlist = await Playlist.findById(playlistId);
  console.log(playlist);
  if (!playlist) {
    throw new ApiError(
      401,
      "No playlist found with this Id at a time of updation in playlist"
    );
  }

  if (playlist.owner.equals(req.user?._id.toString())) {
    (playlist.playlistname = playlistname),
      (playlist.playlistdescription = playlistdescription);
    await playlist.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new apiResponse(200, playlist, "Data Updated to the Playlist"));
  } else {
    throw new ApiError(
      403,
      "You are not allowed to change, only admin can make changes"
    );
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
