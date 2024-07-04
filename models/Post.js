import mongoose from "mongoose";

const PostSchema = mongoose.Schema(
  {
    userId: {
      required: [true, "Please provide userId"],
      type: String,
    },
    firstName: {
      required: true,
      type: String,
    },
    lastName: {
      required: true,
      type: String,
    },
    location: String,
    description: {
      required: true,
      type: String,
    },
    picturePath: {
      type: String,
    },
    userPicturePath: String,
    fileType: {
      type: String,
      enum: ["image", "video", "audio"],
    },
    likes: {
      type: Map,
      of: Boolean,
      default: {},
    },
    comments: {
      type: Array,
      default: [],
    },
    impressions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Post", PostSchema);
