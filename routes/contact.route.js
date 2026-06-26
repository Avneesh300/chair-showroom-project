import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { submitContact } from "../controllers/contact.controller.js";

const router = express.Router();

router.post("/submit", upload.none(), submitContact);

export default router;