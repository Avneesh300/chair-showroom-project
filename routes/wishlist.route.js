import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  addWishlist,
  deleteWishlist,
  getAllWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.none(),
  addWishlist
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllWishlist
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteWishlist
);

export default router;