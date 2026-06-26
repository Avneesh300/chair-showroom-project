import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  registerAddress,
  getAllAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.none(),
  registerAddress
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllAddress
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteAddress
);

export default router;