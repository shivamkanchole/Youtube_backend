import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/Video.model.js";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UploadOnCloudinary } from "../utils/Cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  // get data from body
  // validaton on data if data is required
  // check video uploaded locally or not
  // upload on clodinary
  // now make video object and create it into the database
  const { title, description } = req.body;
  console.log(title);
  if (!(title && description)) {
    throw new ApiError(400, "title and description is a required field");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!videoFileLocalPath) {
    throw new ApiError(401, "video not uploaded locally");
  }
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(401, "thumbnail not uploaded locally");
  }

  const videoFile = await UploadOnCloudinary(videoFileLocalPath);
  if (!videoFile) {
    throw new ApiError(401, "video not uploaded on cloudinary");
  }
  const thumbnail = await UploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(401, "thumbnail not uploaded on cloudinary");
  }
  const user = await User.findById(req.user?._id);

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: user._id,
    duration: videoFile.duration,
  });
  if (!video) {
    throw new ApiError(500, "Server Error try again");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video Uploaded Successfully"));
});

// we need to do this
const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  let val1 = 1;
  if (sortType === "asc") val1 = 1;
  else val1 = -1;
  const skip = (page - 1) * limit;
  const user = await User.findById(userId);

  const data = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
        owner: user._id,
      },
    },
    {
      $sort: {
        [sortBy]: val1,
      },
    },
    {
      $limit: limit,
    },
    {
        $skip: skip
    }
  ]);
//   console.log(data);
   return res
   .status(200)
   .json(new apiResponse(200, data, "All videos fetched"))
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  const { videoId } = req.params;
  //   console.log(videoId)
  if (!videoId) {
    throw new ApiError(400, "Video Id not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(402, "wrong video id | video does not exits");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;
  //   console.log(videoId, title, description);

  if (!(videoId && title && description)) {
    throw new ApiError(400, "All Fields are required while updating");
  }

  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(500, "No user found while updating");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "No Video found");
    }

    if (video.owner.equals(user._id.toString())) {
      (video.title = title), (video.description = description);
      await video.save({ validateBeforeSave: false });
      console.log("we have updated");
    } else {
      throw new ApiError(400, "you are not allowed to update");
    }

    return res
      .status(200)
      .json(new apiResponse(200, video, "Data Updated Successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while updating video details"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;
  //   console.log(videoId);
  if (!videoId) {
    throw new ApiError(400, "videoid is required");
  }

  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(500, "No user found while Deleting");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "No Video found");
    }

    if (video.owner.equals(user._id.toString())) {
      await Video.findByIdAndDelete(videoId);
    } else {
      throw new ApiError(400, "you are not allowed to delete");
    }

    return res
      .status(200)
      .json(new apiResponse(200, video, "Deletion Successfully"));
  } catch (error) {
    throw new ApiError(400, "Something went wrong while Deleting video ");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);
  if (!videoId) {
    throw new ApiError(400, "videoId are required while Toggleing");
  }

  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(500, "No user found while Toggleing");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "No Video found");
    }

    if (video.owner.equals(user._id.toString())) {
      video.isPublished = !video.isPublished;
      await video.save({ validateBeforeSave: false });
      console.log("we have toggled");
    } else {
      throw new ApiError(400, "you are not allowed to Toggle");
    }

    return res
      .status(200)
      .json(new apiResponse(200, video, "Toggling Successfully"));
  } catch (error) {
    throw new ApiError(400, "Something went wrong while toggling ");
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
