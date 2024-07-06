import dbSession from "../db/session.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById({ _id: id });
    if (!user) return res.status(404).json({ msg: "User not found!" });
    // console.log(user);
    if (id !== req.user.id) {
      user.viewedProfile++;
      await user.save();
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById({ _id: id });
    const friends = await Promise.all(
      user.friends.map((id) =>
        User.findById(
          { _id: id },
          {
            firstName: 1,
            lastName: 1,
            occupation: 1,
            location: 1,
            picturePath: 1,
          }
        )
      )
    );
    res.status(200).json(friends);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const addRemoveFriend = async (req, res) => {
  try {
    const { id: userId, friendId } = req.params;
    const user = await User.findById({ _id: userId });
    const friend = await User.findById({ _id: friendId });
    if (userId !== req.user.id) {
      return res.status(403).json({ msg: "Access Denied!" });
    }
    if (userId === friendId) {
      return res.status(400).json({ msg: "Can't friend yourself!" });
    }
    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter((id) => {
        return id !== friendId;
      });
      friend.friends = friend.friends.filter((id) => {
        return id !== userId;
      });
    } else {
      user.friends.push(friendId);
      friend.friends.push(userId);
    }
    await user.save();
    await friend.save();
    const friends = await Promise.all(
      user.friends.map((id) =>
        User.findById(
          { _id: id },
          {
            firstName: 1,
            lastName: 1,
            occupation: 1,
            location: 1,
            picturePath: 1,
          }
        )
      )
    );
    res.status(200).json(friends);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const session = await dbSession();
  try {
    const { id } = req.user;
    const userId = req.params.id;
    if (id !== userId) {
      return res.status(403).json({ msg: "Access Denied!" });
    }
    session.startTransaction();
    const user = await User.findOne({ _id: id }).session(session);
    if (!user) {
      res.status(400).json({ msg: "User not found" });
    }

    const userProfilePublicId = user.picturePath
      .split("/")
      .splice(-3, 3)
      .join("/")
      .split(".")[0];
    await Post.updateMany(
      {
        $or: [{ [`likes.${id}`]: true }, { "comments.userId": id }],
      },
      {
        $pull: { comments: { userId: id } },
        $unset: { [`likes.${id}`]: "" },
      }
    ).session(session);
    await User.updateMany({ friends: id }, { $pull: { friends: id } }).session(
      session
    );
    let filePublicIds = [];
    const posts = await Post.find({ userId: id }, { picturePath: 1 }).session(
      session
    );
    filePublicIds = posts.map((element) => {
      return element.picturePath
        .split("/")
        .splice(-3, 3)
        .join("/")
        .split(".")[0];
    });
    await Post.deleteMany({ userId: id }).session(session);
    await User.findByIdAndDelete({ _id: id }).session(session);
    filePublicIds.forEach(async (public_id) => {
      console.log(public_id);
      const response = await cloudinary.uploader.destroy(public_id);
      console.log(response);
      // fs.unlinkSync(`public/${file}`);
    });

    await cloudinary.uploader.destroy(userProfilePublicId);
    await session.commitTransaction();
    return res.status(200).json({ msg: "User Deleted" });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    return res.status(500).json({ error: error.message });
  } finally {
    console.log("Session Ended");
    await session.endSession();
  }
};
