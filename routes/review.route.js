import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  registerReview,
  getProductReviews,
  deleteReview,
} from "../controllers/review.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.none(),
  registerReview
);

router.post(
  "/list",
  upload.none(),
  getProductReviews
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteReview
);

export default router;