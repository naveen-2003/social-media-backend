import OTP from "../models/OTP.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Post from "../models/Post.js";
import fs from "fs";
import dbSession from "../db/session.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  tls: {
    rejectUnauthorized: false,
  },
  auth: {
    user: process.env.AUTH_MAIL_ID,
    pass: process.env.AUTH_MAIL_PASS,
  },
});

export const sentOTP = async (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ msg: "Please provide the mail address" });
  }
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already registered" });
    }
    const oldOTP = await OTP.find({ email });
    if (oldOTP.length > 0) {
      await OTP.deleteMany({ email });
    }
    const tempUser = await OTP.create({
      email,
      otp: String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
      expireTime: Date.now() + 600000,
    });
    const mailOptions = {
      from: process.env.AUTH_MAIL_ID,
      to: email,
      subject: "Verify your Email Address",
      html: `<h1>Your OTP is ${tempUser.otp}</h1>`,
    };
    transporter.sendMail(mailOptions);
    const token = jwt.sign(
      { email, isVerified: false },
      process.env.JWT_SECRET
    );
    console.log("Sent OTP");
    res.status(200).json({ token, msg: "OTP Sent to your Mail Address" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  if (!req.body.otp) {
    return res.status(400).json({ msg: "Please provide the OTP" });
  }
  if (
    !req.headers.authorization &&
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { email, isVerified } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email });
    if (isVerified || user) {
      return res.status(400).json({ msg: "Already Verified" });
    }
    const otp = await OTP.findOne({ email });
    if (!otp) {
      return res.status(400).json({ msg: "Register to send OTP" });
    }
    if (otp.otp !== req.body.otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }
    if (otp.expireTime < Date.now()) {
      return res.status(400).json({ msg: "OTP Expired" });
    }
    const newtoken = jwt.sign(
      { email, isVerified: true },
      process.env.JWT_SECRET
    );
    res.status(200).json({ msg: "OTP Verified", token: newtoken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const register = async (req, res) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  const token = req.headers.authorization.split(" ")[1];
  const { email, isVerified } = jwt.verify(token, process.env.JWT_SECRET);
  if (!isVerified) {
    return res.status(400).json({ msg: "Please verify the OTP" });
  }
  if (!req.file) {
    return res.status(400).json({ msg: "Please upload a file" });
  }
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.password ||
    !req.body.confirmpassword ||
    !req.body.location ||
    !req.body.occupation
  ) {
    return res.status(400).json({ msg: "Please provide all the fields" });
  }
  // console.log(req.body);
  try {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    const user = await User.create({
      ...req.body,
      email,
      picturePath: req.file.secure_url,
    });
    await OTP.deleteMany({ email });
    const token = user.createJWT();
    res.status(201).json({ msg: "User created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ msg: "Please provide both email and password" });
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Password not matched");
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const token = await user.createJWT();
    res.status(200).json({
      msg: `Welcome ${user.firstName} ${user.lastName}`,
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        picturePath: user.picturePath,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
