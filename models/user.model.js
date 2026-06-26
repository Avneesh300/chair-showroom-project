import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      default: null
    },

    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
      required: true,
    },

    accessToken: {
      type: String,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
    },

    otp: {
  type: String,
  default: null
},

otpExpireAt: {
  type: Date,
  default: null
},

googleId: {
  type: String,
  default: null
},

loginType: {
  type: String,
  enum: [
    "password",
    "otp",
    "google"
  ],
  default: "password",
},

    status: {
      type: String,
      enum: ["1", "0"],
      default: "1",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);