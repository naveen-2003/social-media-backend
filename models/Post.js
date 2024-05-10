import mongoose from "mongoose";

const PostSchema = mongoose.Schema({
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
    required: true,
    type: String,
  },
  userPicturePath: String,
  likes: {
    type: Map,
    of: Boolean,
    default: {},
  },
  comments: {
    type: Array,
    default: [],
  },
});

export default mongoose.model("Post", PostSchema);
