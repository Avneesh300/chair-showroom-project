import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  registerProduct,
  deleteProduct,
  getAllProducts,
  productDetail,
} from "../controllers/product.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.single("product_image"),
  registerProduct
);


router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllProducts
);

router.post(
  "/delete",
  authMiddleware,
  upload.none(),
  deleteProduct
);

router.post(
  "/detail",
  authMiddleware,
  upload.none(),
  productDetail
);
export default router;