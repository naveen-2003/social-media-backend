import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { fileTypeFromFile } from "file-type";
dotenv.config();

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      next();
      return;
    }
    let fileType = await fileTypeFromFile(req.file.path);
    if (!fileType) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: "Invalid file type " });
    }
    fileType = fileType.mime.split("/")[0];
    if (fileType !== "image" && fileType !== "video" && fileType !== "audio") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: "Invalid file type" });
    }
    if (req.url === "/auth/register" && fileType !== "image") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: "Invalid file type" });
    }

    let folder = "socialmedia";
    if (req.url.startsWith("/posts")) folder += "/posts";
    if (req.url.startsWith("/auth/register") || req.url.startsWith("/users"))
      folder += "/users";
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder,
      resource_type: "auto",
    });

    if (!result) {
      return res.status(400).json({ msg: "Upload Failed" });
    }
    fs.unlinkSync(req.file.path);
    req.file = result;
    req.file.resource_type = fileType;
    console.log("File from uploadFile: ", result);
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
  }
};
