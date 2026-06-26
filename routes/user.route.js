import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  sendEmailOtp,
  verifyEmailOtp,
  googleLogin,
  changePassword,
  resetPassword,
  forgotPassword,
   getAllUsers,
  updateUserStatus,
  sendEmailToUser,
} from "../controllers/user.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


router.post(
  "/register",
  upload.none(),
  registerUser
);


router.post(
  "/login",
  upload.none(),
  loginUser
);


router.post(
  "/refresh-token",
  upload.none(),
  refreshAccessToken
);


router.post(
  "/logout",
  upload.none(),
  authMiddleware,
  logoutUser
);

router.post(
  "/send-email-otp",
  upload.none(),
  sendEmailOtp
);

router.post(
  "/verify-email-otp",
  upload.none(),
  verifyEmailOtp
);

router.post(
  "/google-login",
  upload.none(),
  googleLogin
);

router.post(
  "/change-password",
  authMiddleware,
  upload.none(),
  changePassword
);



router.post(
  "/forgot-password",
  upload.none(),
  forgotPassword
);

router.post(
  "/reset-password",
  upload.none(),
  resetPassword
);

router.post(
  "/list",
  authMiddleware,
  upload.none(),
  getAllUsers
);

router.post(
  "/status-update",
  authMiddleware,
  upload.none(),
  updateUserStatus
);

router.post(
  "/send-email",
  authMiddleware,
  upload.none(),
  sendEmailToUser
);






export default router;