import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { getHomeData } from "../controllers/home.controller.js";

const router = express.Router();

router.post("/data", upload.none(), getHomeData);

export default router;