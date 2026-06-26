import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createOrder,
  getAllOrders,
  orderDetail,
  orderStatusUpdate,
  createPaymentOrder,
  verifyPayment,
  createTempPaymentOrder,
  paymentStatusUpdate 
} from "../controllers/order.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  // upload.none(),
  createOrder
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllOrders
);

router.post(
  "/detail",
  authMiddleware,
  upload.none(),
  orderDetail
);

router.post(
  "/status-update",
  authMiddleware,
  upload.none(),
  orderStatusUpdate
);

router.post(
  "/create-payment-order",
  authMiddleware,
  upload.none(),
  createPaymentOrder
);

router.post(
  "/verify-payment",
  authMiddleware,
  upload.none(),
  verifyPayment
);

router.post(
  "/create-temp-payment",
  authMiddleware,
  upload.none(),
  createTempPaymentOrder
);

router.post(
  "/payment-status-update",
  authMiddleware,
  upload.none(),
  paymentStatusUpdate
);


export default router;