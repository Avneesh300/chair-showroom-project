import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  registerCategory,
  getAllCategories,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.single("image"),
  registerCategory
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllCategories
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteCategory
);

export default router;