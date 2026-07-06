import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  addToCart,
  deleteCart,
  getAllCart,
  clearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.none(),
  addToCart
);
router.post(
  "/clear",
  authMiddleware,
  upload.none(),
  clearCart
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllCart
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteCart
);

export default router;