import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  deleteUser,
  updatePassword,
} from "../controllers/users.js";

const router = express.Router();

router.get("/:id", getUser);
router.delete("/:id", deleteUser);
router.post("/:id/updatepassword", updatePassword);
router.get("/:id/friends", getUserFriends);
router.patch("/:id/:friendId", addRemoveFriend);
export default router;
