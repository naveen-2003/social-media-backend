import mongoose from "mongoose";

const ResetSchema = mongoose.Schema({
  email: {
    required: true,
    type: String,
  },
  token: {
    required: true,
    type: String,
  },
  expireTime: {
    required: true,
    type: Date,
  },
});

export default mongoose.model("Reset", ResetSchema);
