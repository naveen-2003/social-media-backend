import User from "../models/User.js";

export const register = async (req, res) => {
  console.log(req.body);
  try {
    const user = await User.create({
      ...req.body,
      picturePath: req.file.filename,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });
    const token = user.createJWT();
    // res.status(201).json({
    //   user: {
    //     id: user._id,
    //   },
    //   token,
    // });
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
    console.log(user);
    console.log(user.email);
    if (!user) {
      return res.status(400).json({ msg: "User not registered" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const token = await user.createJWT();
    res.status(200).json({
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
