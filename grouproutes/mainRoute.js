import express from "express";

import userRoute from "../routes/user.route.js";
import productRoute from "../routes/product.route.js";
import categoryRoute from "../routes/category.route.js";
import couponRoute from "../routes/coupon.route.js";
import cartRoute from "../routes/cart.route.js";
import wishlistRoute from "../routes/wishlist.route.js";
import addressRoute from "../routes/address.route.js";
import orderRoute from "../routes/order.route.js";
import reviewRoute from "../routes/review.route.js";
import brandRoute from "../routes/brand.route.js";
import dashboardRoute from "../routes/dashboard.route.js";
import homeRoutes from "../routes/home.route.js";
import settingRoutes from "../routes/setting.route.js";
import reportRoutes from "../routes/report.route.js";
import contactRoutes from "../routes/contact.route.js";


const router = express.Router();

router.use("/users", userRoute);

router.use("/products", productRoute);

router.use("/categories", categoryRoute);

router.use("/coupons", couponRoute);

router.use("/carts", cartRoute);

router.use("/wishlists", wishlistRoute);

router.use("/addresses", addressRoute);

router.use("/orders", orderRoute);

router.use("/reviews", reviewRoute);
router.use("/brands", brandRoute);
router.use("/dashboard", dashboardRoute);
router.use("/home", homeRoutes);
router.use("/settings", settingRoutes);
router.use("/reports", reportRoutes);
router.use("/contacts", contactRoutes);

export default router;