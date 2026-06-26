import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";

export const addWishlist =
  asyncHandler(async (req, res) => {
    const { product } = req.body;

    if (!product) {
      return responseError(res, "Product is required", 400);
    }

    const productData = await Product.findById(product);
    if (!productData) {
      return responseError(res, "Product not found", 404);
    }

    const existingWishlist = await Wishlist.findOne({
      user: req.user.id,
      product,
    });

    // ✅ Fix - pehle null check, phir property access
    if (existingWishlist) {
      if (existingWishlist.status === "1") {
        // Already active hai → remove karo
        existingWishlist.status = "0";
        await existingWishlist.save();
        return responseSuccess(res, "Product removed from wishlist successfully");
      } else {
        // Pehle remove tha → wapas add karo
        existingWishlist.status = "1";
        await existingWishlist.save();
        return responseSuccess(res, "Product added to wishlist successfully");
      }
    }

    // ✅ Pehli baar add ho raha hai
    await Wishlist.create({
      user: req.user.id,
      product,
    });

    return responseSuccess(res, "Product added to wishlist successfully");
  });
export const deleteWishlist =
  asyncHandler(async (req, res) => {
    const { id, status } = req.body;

    if (!id) {
      return responseError(
        res,
        "Wishlist Id is required",
        400
      );
    }

    if (!status) {
      return responseError(
        res,
        "Status is required",
        400
      );
    }

    const wishlist = await Wishlist.findById(id);

    if (!wishlist) {
      return responseError(
        res,
        "Wishlist item not found",
        404
      );
    }

    if (status === "A") {
      wishlist.status = "0";
      await wishlist.save();
    }
    if (status === "B") {
      wishlist.status = "1";
      await wishlist.save();
    }


    return responseSuccess(
      res,
      "Wishlist item removed successfully"
    );
  });

export const getAllWishlist =
  asyncHandler(async (req, res) => {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      user: req.user.id,
      status: "1",
    };

    const total = await Wishlist.countDocuments(filter);

    const wishlist =
      await Wishlist.find(filter)
        .populate({
          path: "product",
          populate: {
            path: "category",
          },
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

    const pagination = {
      total,
      currentPage: page,
      totalPages: Math.ceil(
        total / limit
      ),
      perPage: limit,
    };

    const formattedData =
      wishlist.map((item) => ({
        id: item._id,
        status: item.status,
        productId: item.product?._id || null,
        name: item.product?.product_name || "",
        sku: item.product?.sku || "",
        brand: item.product?.brand || "",
        image: item.product?.product_image || "",
        mrp: item.product?.mrp || 0,
        sellingPrice: item.product?.sellingPrice || 0,
        stock: item.product?.stock || 0,
        category_id: item.product?.category._id || null,
        category_name: item.product?.category.category_name || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        paginations: pagination,
      }));

    return responseSuccess(
      res,
      "Wishlist fetched successfully",
      formattedData,
    );
  });