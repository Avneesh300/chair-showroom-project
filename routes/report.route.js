import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getReportStats,
  exportOrdersReport,
  exportInventoryReport,
} from "../controllers/report.controller.js";

const router = express.Router();

router.post("/stats", authMiddleware, upload.none(), getReportStats);
router.post("/export-orders", authMiddleware, upload.none(), exportOrdersReport);
router.post("/export-inventory", authMiddleware, upload.none(), exportInventoryReport);

export default router;