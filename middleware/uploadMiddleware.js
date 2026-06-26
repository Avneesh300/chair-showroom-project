import multer from "multer";
import path from "path";

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName +
        path.extname(file.originalname)
    );
  },
});

// allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes =
    /jpg|jpeg|png|webp|pdf|doc|docx|xls|xlsx|csv|ppt|pptx|txt|zip/;

  const extName = allowedTypes.test(
    path
      .extname(file.originalname)
      .toLowerCase()
  );

  if (extName) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

// multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

export default upload;