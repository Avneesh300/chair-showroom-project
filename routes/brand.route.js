import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  registerBrand,
  deleteBrand,
  getAllBrand,
} from "../controllers/brand.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.single(),
  registerBrand
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllBrand
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteBrand
);

export default router;