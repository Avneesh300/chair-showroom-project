import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getSettings, saveSettings } from "../controllers/setting.controller.js";

const router = express.Router();

router.post("/get", authMiddleware, upload.none(), getSettings);
router.post("/save", authMiddleware, upload.none(), saveSettings);

export default router;