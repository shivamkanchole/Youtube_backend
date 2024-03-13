import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    playlistname: {
      type: String,
      required: true,
    },
    playlistdescription: {
      type: String,
      required: true,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
