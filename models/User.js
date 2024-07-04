import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const UserSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please provide firstName"],
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: [true, "Please provide lastName"],
      min: 2,
      max: 40,
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: [true, "User already registered"],
      min: 2,
      max: 40,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a Password"],
      min: 3,
    },
    picturePath: {
      type: String,
      default: "",
    },
    friends: {
      type: Array,
      default: [],
    },
    location: String,
    occupation: String,
    viewedProfile: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// UserSchema.pre("save", async function () {
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET
  );
};

UserSchema.methods.comparePassword = async function (inputPassword) {
  console.log("inputPassword", inputPassword);
  console.log("this.password", this.password);
  const isPasswordCorrect = await bcrypt.compare(inputPassword, this.password);

  return isPasswordCorrect;
};
UserSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", UserSchema);
