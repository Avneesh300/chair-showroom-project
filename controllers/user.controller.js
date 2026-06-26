import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import jwt from "jsonwebtoken";
import sendEmail from "../config/sendEmail.js";
import { OAuth2Client } from "google-auth-library";
import Order from "../models/order.model.js"; 

const client = new OAuth2Client( process.env.GOOGLE_CLIENT_ID );


export const registerUser = asyncHandler(
  async (req, res) => {
    const {
      id,
      full_name,
      email,
      mobile,
      password,
    } = req.body;

    if (!full_name) {
      return responseError(
        res,
        "Full Name are required",
        400
      );
    }
    if (!email) {
      return responseError(
        res,
        "Email are required",
        400
      );
    }
    if (!mobile) {
      return responseError(
        res,
        "Mobile are required",
        400
      );
    }
    if (id) {
      const updateData = {
        full_name,
        email,
        mobile,
      };

      if (password) {
        updateData.password =
          await bcrypt.hash(password, 10);
      }

      const updatedUser =
        await User.findByIdAndUpdate(
          id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedUser) {
        return responseError(
          res,
          "User not found",
          404
        );
      }

      return responseSuccess(
        res,
        "User updated successfully"
      );
    }

    const emailExists =
      await User.findOne({
        email,
        _id: { $ne: id }
      });

    if (emailExists) {
      return responseError(
        res,
        "Email already exists",
        400
      );
    }

    if (!password) {
      return responseError(
        res,
        "Password is required",
        400
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email,
      mobile,
      password: hashedPassword,
      role: "customer",
    });

    await sendEmail(
      email,
      "Welcome to Chair Showroom",
      `
  <div style="font-family: Arial, sans-serif;">
    <h2>Welcome ${full_name}</h2>

    <p>
      Thank you for registering with
      <b>Chair Showroom</b>.
    </p>

    <p>
      Your account has been created
      successfully.
    </p>

    <p>
      You can now login and start
      shopping.
    </p>

    <br/>

    <p>
      Regards,<br/>
      Chair Showroom Team
    </p>
  </div>
  `
    );

    return responseSuccess(
      res,
      "User registered successfully",
      user
    );
  }
);


export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return responseError(
      res,
      "Email and Password are required",
      400
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return responseError(
      res,
      "Invalid credentials",
      401
    );
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    return responseError(
      res,
      "Invalid credentials",
      401
    );
  }

  const accessToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  user.accessToken = accessToken;
  user.refreshToken = refreshToken;

  await user.save();

  return responseSuccess(
    res,
    "Login successful",
    {
      user,
      accessToken,
      refreshToken,
    }
  );
});


export const logoutUser = asyncHandler(async (req, res) => {

  const user =
    await User.findById(req.user.id);

  if (!user) {
    return responseError(
      res,
      "User not found",
      404
    );
  }

  user.accessToken = null;
  user.refreshToken = null;

  await user.save();

  return responseSuccess(
    res,
    "Logout successful"
  );
});

export const refreshAccessToken = asyncHandler(
  async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return responseError(
        res,
        "Refresh token is required",
        400
      );
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );

      const user = await User.findById(
        decoded.id
      );

      if (!user) {
        return responseError(
          res,
          "User not found",
          404
        );
      }


      if (
        user.refreshToken !== refreshToken
      ) {
        return responseError(
          res,
          "Invalid refresh token",
          401
        );
      }

      const accessToken = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        process.env.JWT_ACCESS_SECRET,
        {
          expiresIn: "1d",
        }
      );

      const newRefreshToken = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "7d",
        }
      );

      user.accessToken = accessToken;
      user.refreshToken = newRefreshToken;

      await user.save();

      return responseSuccess(
        res,
        "Token refreshed successfully",
        {
          accessToken,
          refreshToken: newRefreshToken,
        }
      );
    } catch (error) {
      return responseError(
        res,
        "Invalid or expired refresh token",
        401
      );
    }
  }
);

export const sendEmailOtp =
  asyncHandler(async (req, res) => {

    const { email } = req.body;

    if (!email) {
      return responseError(
        res,
        "Email is required",
        400
      );
    }

    const user =
      await User.findOne({ email });

    if (!user) {
      return responseError(
        res,
        "User not found",
        404
      );
    }

    const otp =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();

    user.otp = otp;

    user.otpExpireAt =
      new Date(
        Date.now() + 5 * 60 * 1000
      );

    await user.save();

    await sendEmail(
      email,
      "Login OTP",
      `
      <h2>Your Login OTP</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for 5 minutes.</p>
      `
    );

    return responseSuccess(
      res,
      "OTP sent successfully"
    );
  });

export const verifyEmailOtp =
  asyncHandler(async (req, res) => {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return responseError(
        res,
        "Email and OTP are required",
        400
      );
    }

    const user =
      await User.findOne({ email });

    if (!user) {
      return responseError(
        res,
        "User not found",
        404
      );
    }

    if (user.otp !== otp) {
      return responseError(
        res,
        "Invalid OTP",
        400
      );
    }

    if (
      !user.otpExpireAt ||
      user.otpExpireAt < new Date()
    ) {
      return responseError(
        res,
        "OTP expired",
        400
      );
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const refreshToken = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );

    user.accessToken =
      accessToken;

    user.refreshToken =
      refreshToken;

    user.otp = null;
    user.otpExpireAt = null;

    await user.save();

    return responseSuccess(
      res,
      "Login successful",
      {
        user
      }
    );
  });


export const googleLogin =
  asyncHandler(async (req, res) => {

    const { token } = req.body;

    if (!token) {
      return responseError(
        res,
        "Google token is required",
        400
      );
    }

    const ticket =
      await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

    const payload = ticket.getPayload();

    const {
      email,
      name,
      sub,
    } = payload;

    let user =
      await User.findOne({ email });

    // New User
    if (!user) {

      user =
        await User.create({
          full_name: name,
          email,
          mobile: "",
          password: null,
          googleId: sub,
          loginType: "google",
          role: "customer",
        });
    }

    // Existing User
    else {

      if (!user.googleId) {
        user.googleId = sub;
      }

      user.loginType =
        "google";

      await user.save();
    }

    const accessToken =
      jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        process.env.JWT_ACCESS_SECRET,
        {
          expiresIn: "1d",
        }
      );

    const refreshToken =
      jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "7d",
        }
      );

    user.accessToken =
      accessToken;

    user.refreshToken =
      refreshToken;

    await user.save();

    return responseSuccess(
      res,
      "Google login successful",
      {
        user,
        accessToken,
        refreshToken,
      }
    );
  });

export const changePassword =
  asyncHandler(async (req, res) => {

    const {
      oldPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!oldPassword) {
      return responseError(
        res,
        "Old password is required",
        400
      );
    }

    if (!newPassword) {
      return responseError(
        res,
        "New password is required",
        400
      );
    }

    if (!confirmPassword) {
      return responseError(
        res,
        "Confirm password is required",
        400
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return responseError(
        res,
        "Passwords do not match",
        400
      );
    }

    const user =
      await User.findById(
        req.user.id
      );

    if (!user) {
      return responseError(
        res,
        "User not found",
        404
      );
    }

    const isMatch =
      await bcrypt.compare(
        oldPassword,
        user.password
      );

    if (!isMatch) {
      return responseError(
        res,
        "Old password is incorrect",
        400
      );
    }

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (samePassword) {
      return responseError(
        res,
        "New password must be different from old password",
        400
      );
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    return responseSuccess(
      res,
      "Password changed successfully"
    );
  });


export const forgotPassword =
  asyncHandler(async (req, res) => {

    const { email } = req.body;

    if (!email) {
      return responseError(
        res,
        "Email is required",
        400
      );
    }

    const user =
      await User.findOne({ email });

    if (!user) {
      return responseError(
        res,
        "User not found",
        404
      );
    }

    const otp =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();

    user.otp = otp;

    user.otpExpireAt =
      new Date(
        Date.now() + 5 * 60 * 1000
      );

    await user.save();

    await sendEmail(
      email,
      "Reset Password OTP",
      `
      <div style="font-family:Arial">
        <h2>Password Reset Request</h2>

        <p>Your OTP is:</p>

        <h1>${otp}</h1>

        <p>
          This OTP is valid for
          5 minutes.
        </p>

        <p>
          If you did not request
          this, please ignore this
          email.
        </p>
      </div>
      `
    );

    return responseSuccess(
      res,
      "OTP sent successfully"
    );
  });


export const resetPassword =
  asyncHandler(async (req, res) => {

    const {
      email,
      otp,
      password,
      confirmPassword,
    } = req.body;

    if (!email) {
      return responseError(
        res,
        "Email is required",
        400
      );
    }

    if (!otp) {
      return responseError(
        res,
        "OTP is required",
        400
      );
    }

    if (!password) {
      return responseError(
        res,
        "Password is required",
        400
      );
    }

    if (!confirmPassword) {
      return responseError(
        res,
        "Confirm password is required",
        400
      );
    }

    if (
      password !==
      confirmPassword
    ) {
      return responseError(
        res,
        "Passwords do not match",
        400
      );
    }

    const user =
      await User.findOne({ email });

    if (!user) {
      return responseError(
        res,
        "User not found",
        404
      );
    }

    if (user.otp !== otp) {
      return responseError(
        res,
        "Invalid OTP",
        400
      );
    }

    if (
      !user.otpExpireAt ||
      user.otpExpireAt < new Date()
    ) {
      return responseError(
        res,
        "OTP expired",
        400
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    user.password =
      hashedPassword;

    user.otp = null;
    user.otpExpireAt = null;

    user.accessToken = null;
    user.refreshToken = null;

    await user.save();

    return responseSuccess(
      res,
      "Password reset successfully"
    );
  });

  export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id, status } = req.body;

  if (!id) return responseError(res, "User Id is required", 400);
  if (!status) return responseError(res, "Status is required", 400);

  const user = await User.findById(id);
  if (!user) return responseError(res, "User not found", 404);

  user.status = status === "A" ? "0" : "1";
  await user.save();

  return responseSuccess(res, "User status updated successfully");
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.body.page) || 1;
  const limit = parseInt(req.body.limit) || 10;
  const search = req.body.search || "";
  const skip = (page - 1) * limit;

  let filter = { role: "customer" };

  if (search) {
    filter.$or = [
      { full_name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select("-password -accessToken -refreshToken -otp -otpExpireAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // ✅ Har user ke orders fetch karo
  const formattedUsers = await Promise.all(
    users.map(async (user) => {
      const orders = await Order.find({
        user: user._id,
        orderStatus: { $ne: "CANCELLED" },
      }).select("totalAmount");

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        status: user.status,
        loginType: user.loginType,
        role: user.role,
        createdAt: user.createdAt,
        totalOrders,   
        totalSpent,    
      };
    })
  );

  const pagination = {
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    perPage: limit,
  };

  return responseSuccess(res, "Users fetched successfully", {
    users: formattedUsers,
    pagination,
  });
});

export const sendEmailToUser = asyncHandler(async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email) return responseError(res, "Email is required", 400);
  if (!subject) return responseError(res, "Subject is required", 400);
  if (!message) return responseError(res, "Message is required", 400);

  const user = await User.findOne({ email });
  if (!user) return responseError(res, "User not found", 404);

  await sendEmail(email, subject, `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>${subject}</h2>
      <p>${message.replace(/\n/g, "<br/>")}</p>
      <br/>
      <p>Regards,<br/>Chair Showroom Team</p>
    </div>
  `);

  return responseSuccess(res, "Email sent successfully");
});
