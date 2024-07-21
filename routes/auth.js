import express from "express";
import {
  login,
  resetPassword,
  sendResetLink,
  sentOTP,
  verifyOTP,
} from "../controllers/auth.js";
const router = express.Router();

router.post("/login", login);
router.post("/sendresetlink", sendResetLink);
router.post("/sendotp", sentOTP);
router.post("/verifyotp", verifyOTP);
export default router;
