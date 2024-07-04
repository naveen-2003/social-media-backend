import mongoose from "mongoose";

const OTPSchema = mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide email"],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
  },

  otp: {
    required: true,
    type: String,
    length: 4,
  },
  expireTime: {
    required: true,
    type: Date,
  },
});

export default mongoose.model("OTP", OTPSchema);
