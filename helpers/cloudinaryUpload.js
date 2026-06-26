import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const cloudinaryUpload = async (localFilePath) => {
  try {
    const result = await cloudinary.uploader.upload(
      localFilePath,
      {
        folder: "myapp",
        resource_type: "raw",
      }
    );

    fs.unlinkSync(localFilePath);

    return result;
  } catch (error) {
    if (
      localFilePath &&
      fs.existsSync(localFilePath)
    ) {
      fs.unlinkSync(localFilePath);
    }

    throw error;
  }
};

export default cloudinaryUpload;