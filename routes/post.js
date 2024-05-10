import express from "express";
import { getFeedPosts, getUserPosts, likePost } from "../controllers/posts.js";
import authentication from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authentication, getFeedPosts);
router.get("/:userId/posts", authentication, getUserPosts);
router.patch("/:id/like", authentication, likePost);

export default router;
