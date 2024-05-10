import User from "../models/User.js";
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById({ _id: id });
    if (!user) return res.status(404).json({ msg: "User not found!" });
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
