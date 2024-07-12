import Post from "../models/Post.js";
import User from "../models/User.js";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const description = req.body.description;
    const userId = req.user.id;
    const user = await User.findOne({ _id: userId });

    const post = await Post.create({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      userPicturePath: user.picturePath,
      ...(req.file && {
        picturePath: req.file.secure_url,
        fileType: req.file.resource_type,
      }),
      description,
    });
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(201).json(posts);
  } catch (error) {
    res.status(409).json({ msg: error.message });
  }
};

export const getFeedPosts = async (req, res) => {
  let { page } = req.query;
  if (!page) page = 0;
  const postPerPage = 10;
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(page * postPerPage)
      .limit(postPerPage);

    posts.forEach(async (post) => {
      if (post.userId === req.user.id) return;
      post.impressions++;
      await User.findByIdAndUpdate(
        { _id: post.userId },
        { $inc: { impressions: 1 } }
      );
      await post.save();
    });

    // console.log(posts);
    res.status(200).json(posts);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  let { page } = req.query;
  if (!page) page = 0;
  const postPerPage = 10;
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(page * postPerPage)
      .limit(postPerPage);

    posts.forEach(async (post) => {
      if (post.userId === req.user.id) return;
      post.impressions++;
      await post.save();
    });
    if (userId === req.user.id) {
      return res.status(200).json(posts);
    }
    await User.findByIdAndUpdate(
      { _id: userId },
      { $inc: { impressions: posts.length } }
    );

    res.status(200).json(posts);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const post = await Post.findById({ _id: id });
    if (post.likes.get(userId)) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }
    const updatedPost = await Post.findByIdAndUpdate(
      { _id: id },
      { likes: post.likes },
      { new: true }
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: error.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { comment } = req.body;
    const post = await Post.findById({ _id: id });
    const user = await User.findById({ _id: userId });
    post.comments.unshift({
      userId,
      fullName: `${user.firstName} ${user.lastName}`,
      userPicturePath: user.picturePath,
      comment,
      createdAt: Date.now(),
    });
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { comment, commentedUser } = req.body;
    if (!comment || !commentedUser)
      return res
        .status(400)
        .json({ msg: "Please provide the comment and the commented user" });
    const post = await Post.findById({ _id: id });
    if (!post) return res.status(404).json({ msg: "Post not found" });
    const commentIndex = post.comments.findIndex(
      (c) => c.userId === commentedUser && c.comment === comment
    );
    if (commentIndex === -1)
      return res.status(404).json({ msg: "Comment not found" });
    post.comments.splice(commentIndex, 1);
    await post.save();
    res.status(200).json(post);
  } catch (error) {}
};

export const deletePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    if (!postId) {
      return res.status(400).json({ msg: "Please provide the Post ID" });
    }
    const post = await Post.findById({ _id: postId });
    if (!post) {
      return res.status(404).json({ msg: "Post not found!" });
    }
    if (post.userId !== userId) {
      return res.status(401).json({ msg: "Unauthorized access" });
    }
    //Deleting the post attachment if exists
    if (post.picturePath) {
      const public_id = post.picturePath
        .split("/")
        .splice(-3, 3)
        .join("/")
        .split(".")[0];
      const response = await cloudinary.uploader.destroy(public_id, {
        resource_type: post.fileType === "image" ? "image" : "video",
      });
      if (response.result !== "ok")
        return res
          .status(400)
          .json({ msg: "Failed to delete the post attachment" });
    }

    await Post.deleteOne({ _id: postId });
    res.status(200).json({ msg: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: error.message });
  }
};
