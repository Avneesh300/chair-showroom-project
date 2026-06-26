import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.post(
  "/stats",
  authMiddleware,
  upload.none(),
  getDashboardStats
);

export default router;