import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connetDB from "./db/connect.js";
import { register } from "./controllers/auth.js";
import crypto from "crypto";
import { users, posts } from "./data/index.js";
import User from "./models/User.js";
import Post from "./models/Post.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "same-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

//Import routes
import authRoute from "./routes/auth.js";
import userRoute from "./routes/user.js";
import postRoute from "./routes/post.js";
import authentication from "./middlewares/auth.js";
import { createPost } from "./controllers/posts.js";

// Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: async function (req, file, cb) {
    const filename = await crypto.randomBytes(16).toString("hex");
    cb(null, `${filename}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", authentication, upload.single("picture"), createPost);

//Routers
app.use("/auth", authRoute);
app.use("/users", userRoute);
app.use("/posts", authentication, postRoute);

const PORT = process.env.PORT || 3000;
try {
  connetDB(process.env.MONGO_URL);
  app.listen(PORT, async () => {
    // await User.insertMany(users);
    // await Post.insertMany(posts);
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.log(error);
}