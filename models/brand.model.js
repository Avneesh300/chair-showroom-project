import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    brand_name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["1", "0"],
      default: "1",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Brand",
  brandSchema
);