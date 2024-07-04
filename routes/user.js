import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  deleteUser,
} from "../controllers/users.js";

const router = express.Router();

router.get("/:id", getUser);
router.delete("/:id", deleteUser);
router.get("/:id/friends", getUserFriends);
router.patch("/:id/:friendId", addRemoveFriend);
export default router;
