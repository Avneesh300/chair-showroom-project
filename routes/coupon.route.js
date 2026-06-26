import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  registerCoupon,
  getAllCoupons,
  deleteCoupon,
  applyCoupon
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.none(),
  registerCoupon
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllCoupons
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteCoupon
);
router.post(
  "/apply-coupon",
  authMiddleware,
  upload.none(),
  applyCoupon
);

export default router;