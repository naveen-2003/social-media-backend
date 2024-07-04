import express from "express";
import {
  commentPost,
  deleteComment,
  deletePost,
  getFeedPosts,
  getUserPosts,
  likePost,
} from "../controllers/posts.js";
import authentication from "../middlewares/auth.js";

const router = express.Router();
//Route /posts
router.get("/", authentication, getFeedPosts);
router.delete("/:id", authentication, deletePost);
router.get("/:userId/posts", authentication, getUserPosts);
router.patch("/:id/like", authentication, likePost);
router.post("/:id/comment", authentication, commentPost);
router.delete("/:id/comment", authentication, deleteComment);

export default router;
