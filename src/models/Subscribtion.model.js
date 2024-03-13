import mongoose from "mongoose";

const SubscribtionSchema = new mongoose.Schema(
  {
    Subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    Channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

export const Subscribtion = mongoose.model("Subscribtion", SubscribtionSchema)
