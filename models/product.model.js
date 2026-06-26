import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    product_name: {
      type: String,
      required: true,
      trim: true,
    },

    product_image: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },
    color_name: {
      type: String,
      required: true,
      trim: true,
    },
    color_code: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    material: {
      type: String,
      trim: true,
    },

    frameMaterial: {
      type: String,
      trim: true,
    },

    seatHeight: {
      type: String,
      trim: true,
    },

    weightCapacity: {
      type: String,
      trim: true,
    },

    armrest: {
      type: String,
      trim: true,
    },

    headrest: {
      type: String,
      trim: true,
    },

    recline: {
      type: String,
      trim: true,
    },

    warranty: {
      type: String,
      trim: true,
    },

    dimensions: {
      type: String,
      trim: true,
    },
    mrp: {
      type: Number,
      default: 0,
    },

    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    slug: {
      type: String,
      unique: true,
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
  "Product",
  productSchema
);