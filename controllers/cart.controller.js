import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";

export const addToCart =
  asyncHandler(async (req, res) => {
    const {
      product,
      quantity,
    } = req.body;

    if (!product) {
      return responseError(
        res,
        "Product is required",
        400
      );
    }

    const productData =
      await Product.findById(product);

    if (!productData) {
      return responseError(
        res,
        "Product not found",
        404
      );
    }
    const existingcartItem = await Cart.findOne({
      user: req.user.id,
      product,
      status: "1",
    });

    if (existingcartItem) {
      return responseSuccess(
        res,
        "Product already in cart",
        400
      );
    }

    // const cartItem =
    //   await Cart.create({
    //     user: req.user.id,
    //     product,
    //   });

    const cartItem = await Cart.create({
      user: req.user.id,
      product,
      addToCartQuantity: quantity || 1,
    });

    return responseSuccess(
      res,
      "Product added to cart successfully",
    );
  });


export const deleteCart =
  asyncHandler(async (req, res) => {
    const { id, status } = req.body;

    if (!id) {
      return responseError(
        res,
        "Cart Id is required",
        400
      );
    }

    if (!status) {
      return responseError(
        res,
        "status is required",
        400
      );
    }

    const cart =
      await Cart.findById(id);

    if (!cart) {
      return responseError(
        res,
        "Cart item not found",
        404
      );
    }

    if (status === "A") {
      cart.status = "0";
      await cart.save();

    }
    if (status === "B") {
      cart.status = "1";
      await cart.save();

    }

    return responseSuccess(
      res,
      "Cart item removed successfully"
    );
  });

export const getAllCart =
  asyncHandler(async (req, res) => {
    const page =
      parseInt(req.body.page) || 1;

    const limit =
      parseInt(req.body.limit) || 10;

    const skip =
      (page - 1) * limit;

    const filter = {
      user: req.user.id,
      status: "1",
    };

    const total =
      await Cart.countDocuments(
        filter
      );

    const carts = await Cart.find(filter)
      .populate({
        path: "product",
        populate: [
          {
            path: "category",
          },
          {
            path: "brand",
          },
        ],
      })
      .sort({ createdAt: -1 })
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

    // const formattedData = carts
    //   .filter(item => item.product)
    //   .map((item) => ({
    //     id: item._id,

    //     productId:
    //       item.product._id,

    //     name:
    //       item.product.product_name,

    //     sku:
    //       item.product.sku,

    //     brand:
    //       item.product.brand
    //         ?.brand_name || "",

    //     quantity:
    //       item.quantity || 1,

    //     mrp:
    //       item.product.mrp || 0,

    //     sellingPrice:
    //       item.product.sellingPrice || 0,

    //     totalPrice:
    //       (item.product.sellingPrice || 0) *
    //       (item.quantity || 1),

    //     colorName:
    //       item.product.color_name || "",

    //     colorCode:
    //       item.product.color_code || "",

    //     image:
    //       item.product.product_image || "",

    //     stock:
    //       item.product.stock || 0,

    //     category:
    //       item.product.category || null,

    //     createdAt:
    //       item.createdAt,
    //     updatedAt: item.updatedAt,
    //     paginations: pagination,
    //   }));

    const formattedData = carts.map((item) => ({
      id: item._id,
      productId: item.product?._id,
      name: item.product?.product_name || "",
      image: item.product?.product_image || "",
      sellingPrice: item.product?.sellingPrice || 0,
      mrp: item.product?.mrp || 0,
      brand_name: item.product?.brand?.brand_name || "",
      color_name: item.product?.color_name || "",
      slug: item.product?.slug || "",
      stock: item.product?.stock || 0,
      status: item.status,
      quantity: item.addToCartQuantity || 1,
      paginations: pagination,
    }));

    return responseSuccess(
      res,
      "Cart fetched successfully",

      formattedData,

    );
  });

export const clearCart = asyncHandler(async (req, res) => {
  const result = await Cart.updateMany(
    {
      user: req.user.id,
      status: "1",
    },
    {
      $set: {
        status: "0",
      },
    }
  );

  return responseSuccess(
    res,
    "Cart cleared successfully",
    {
      modifiedCount: result.modifiedCount,
    }
  );
});


export const updateCartQuantity =
  asyncHandler(async (req, res) => {
    const { id, quantity } = req.body;

    if (!id) {
      return responseError(
        res,
        "Cart Id is required",
        400
      );
    }

    if (!quantity || quantity < 1) {
      return responseError(
        res,
        "Valid quantity is required",
        400
      );
    }

    const cart = await Cart.findById(id);

    if (!cart) {
      return responseError(
        res,
        "Cart item not found",
        404
      );
    }

    cart.addToCartQuantity = quantity;

    await cart.save();

    return responseSuccess(
      res,
      "Cart quantity updated successfully"
    );
  });