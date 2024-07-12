import dbSession from "../db/session.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { validate } from "../utils/validation.js";

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

export const updateUser = async (req, res) => {
  const session = await dbSession();
  try {
    session.startTransaction();
    const id = req.user.id;
    const user = await User.findById({ _id: id }).session(session);
    if (!user) {
      return res.status(404).json({ msg: "User not found!" });
    }
    const oldPicturePath = user.picturePath
      .split("/")
      .splice(-3, 3)
      .join("/")
      .split(".")[0];
    if (req.file) {
      console.log("File : ", req.file);
      user.picturePath = req.file.secure_url;
    }
    if (req.body.firstName && validate(req.body.firstName, "alpha")) {
      user.firstName = req.body.firstName;
    }
    if (req.body.lastName && validate(req.body.lastName, "alpha")) {
      user.lastName = req.body.lastName;
    }
    if (req.body.location && validate(req.body.location, "alphanumeric")) {
      user.location = req.body.location;
    }
    if (req.body.occupation && validate(req.body.firstName, "string")) {
      user.occupation = req.body.occupation;
    }
    if (req.body.links && Array.isArray(req.body.links)) {
      const links = req.body.links;
      if (links.length > 5) {
        return res.status(400).json({ msg: "You can only have 5 links" });
      }
      links?.some(async (link) => {
        if (typeof link === "string" && !validate(link, "url")) {
          return res.status(400).json({ msg: "Invalid URL" });
        }
      });
      user.links = links;
    }
    await user.save();
    await Post.updateMany(
      { userId: id },
      {
        $set: {
          firstName: user.firstName,
          lastName: user.lastName,
          location: user.location,
          userPicturePath: user.picturePath,
        },
      }
    ).session(session);
    await Post.updateMany(
      { "comments.userId": id },
      {
        $set: {
          "comments.$[comment].fullName": `${user.firstName} ${user.lastName}`,
          "comments.$[comment].userPicturePath": user.picturePath,
        },
      },
      { arrayFilters: [{ "comment.userId": id }] }
    ).session(session);
    await cloudinary.uploader.destroy(oldPicturePath);
    await session.commitTransaction();
    res.status(200).json(user);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ msg: error.message });
  } finally {
    await session.endSession();
  }
};
