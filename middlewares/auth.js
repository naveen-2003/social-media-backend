import jwt from "jsonwebtoken";

const authentication = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(403).json({ msg: "Access Denied!" });
  }
  const token = authHeader.split(" ")[1];
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload) {
    return res.status(403).json({ msg: "Access Denied!" });
  }
  req.user = payload;
  next();
};

export default authentication;
