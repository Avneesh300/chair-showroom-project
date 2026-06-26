import Product from "../models/product.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";
import cloudinaryUpload from "../helpers/cloudinaryUpload.js";
import slugify from "slugify";

export const registerProduct =
  asyncHandler(async (req, res) => {
    const {
      id,
      category,
      brand,
      product_name,
      description,
      color_name,
      color_code,
      sku,
      material,
      frameMaterial,
      seatHeight,
      weightCapacity,
      armrest,
      headrest,
      recline,
      warranty,
      dimensions,
      mrp,
      sellingPrice,
      stock,
      slug,
    } = req.body;

    if (!category) {
      return responseError(
        res,
        "Category is required",
        400
      );
    }

    if (!brand) {
      return responseError(
        res,
        "Brand is required",
        400
      );
    }

    if (!product_name) {
      return responseError(
        res,
        "Product name is required",
        400
      );
    }

    if (!color_name) {
      return responseError(
        res,
        "Color name is required",
        400
      );
    }

    if (!color_code) {
      return responseError(
        res,
        "Color code is required",
        400
      );
    }

    if (!sku) {
      return responseError(
        res,
        "SKU is required",
        400
      );
    }

    if (
      sellingPrice &&
      mrp &&
      Number(sellingPrice) > Number(mrp)
    ) {
      return responseError(
        res,
        "Selling price cannot be greater than MRP",
        400
      );
    }

    let imageUrl = "";

    if (req.file) {
      const uploadedImage =
        await cloudinaryUpload(
          req.file.path
        );

      imageUrl = uploadedImage.secure_url;
    }

    if (!slug) {
      return responseError(
        res,
        "Slug name is required",
        400
      );
    }

    if (id) {
      const productData = await Product.findById(id);
      if (!productData) {
        return responseError(
          res,
          "Product not found",
          404
        );
      }

      const existingSku =
        await Product.findOne({
          sku,
          _id: {
            $ne: id,
          },
        });

      if (existingSku) {
        return responseError(
          res,
          "SKU already exists",
          400
        );
      }

      const existingSlug = await Product.findOne({
        slug,
        _id: { $ne: id },
      });

      if (existingSlug) {
        return responseError(
          res,
          "Slug already exists",
          400
        );
      }

      productData.category = category;
      productData.brand = brand;
      productData.product_name = product_name;

      if (imageUrl) {
        productData.product_image = imageUrl;
      }
      productData.description = description;
      productData.color_name = color_name;
      productData.color_code = color_code;
      productData.sku = sku;
      productData.slug = slug;
      productData.material = material;
      productData.frameMaterial = frameMaterial;
      productData.seatHeight = seatHeight;
      productData.weightCapacity = weightCapacity;
      productData.armrest = armrest;
      productData.headrest = headrest;
      productData.recline = recline;
      productData.warranty = warranty;
      productData.dimensions = dimensions;
      productData.mrp = mrp || 0;
      productData.sellingPrice = sellingPrice || 0;
      productData.stock = stock || 0;
      productData.createdBy = req.user.id;
      await productData.save();
      return responseSuccess(
        res,
        "Product updated successfully"
      );
    }

    const existingProduct =
      await Product.findOne({
        sku,
      });

    if (existingProduct) {
      return responseError(
        res,
        "SKU already exists",
        400
      );
    }

    if (!imageUrl) {
      return responseError(
        res,
        "Product image is required",
        400
      );
    }

    const existingSlug = await Product.findOne({
      slug,
    });

    if (existingSlug) {
      return responseError(
        res,
        "Slug already exists",
        400
      );
    }

    await Product.create({
      category,
      brand,
      product_name,
      product_image: imageUrl,
      description,
      color_name,
      color_code,
      sku,
      material,
      frameMaterial,
      seatHeight,
      weightCapacity,
      armrest,
      headrest,
      recline,
      warranty,
      dimensions,
      mrp: mrp || 0,
      sellingPrice: sellingPrice || 0,
      stock: stock || 0,
      slug,
      createdBy: req.user.id,
    });
    return responseSuccess(
      res,
      "Product created successfully"
    );
  });

export const deleteProduct =
  asyncHandler(async (req, res) => {
    const { id, status } = req.body;

    if (!id) {
      return responseError(
        res,
        "Id is required",
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

    const product =
      await Product.findById(id);

    if (!product) {
      return responseError(
        res,
        "Product not found",
        404
      );
    }

    if (status === "A") {
      product.status = "0";
    }

    if (status === "B") {
      product.status = "1";
    }

    await product.save();

    return responseSuccess(
      res,
      "Product Status Updated Successfully",

    );
  });


export const getAllProducts =
  asyncHandler(async (req, res) => {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const search = req.body.search || "";
    const slug = req.params.slug;
    const sort = req.body.sort || "newest";
    const skip = (page - 1) * limit;

    // ✅ sortOption pehle define karo
    let sortOption = { createdAt: -1 };
    if (sort === "price-low") {
      sortOption = { sellingPrice: 1 };
    } else if (sort === "price-high") {
      sortOption = { sellingPrice: -1 };
    }

    let filter = {};

    if (search) {
      filter.product_name = {
        $regex: search,
        $options: "i",
      };
    }

    if (slug) {
      filter.slug = slug;
    }

    if (req.body.category) {
      filter.category = req.body.category;
    }

    if (req.body.brand) {
      filter.brand = req.body.brand;
    }

    if (req.body.minPrice !== undefined && req.body.maxPrice !== undefined) {
      filter.sellingPrice = {
        $gte: Number(req.body.minPrice),
        $lte: Number(req.body.maxPrice),
      };
    }

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category", "category_name")
      .populate("brand", "brand_name")
      .populate("createdBy", "full_name email")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const pagination = {
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      perPage: limit,
    };

    const formattedData = products.map((item) => ({
      id: item._id,
      category: item.category ? {
        id: item.category._id,
        category_name: item.category.category_name,
      } : null,
      brand: item.brand ? {
        id: item.brand._id,
        brand_name: item.brand.brand_name,
      } : null,
      product_name: item.product_name,
      product_image: item.product_image,
      description: item.description,
      color_name: item.color_name,
      color_code: item.color_code,
      sku: item.sku,
      material: item.material,
      frameMaterial: item.frameMaterial,
      seatHeight: item.seatHeight,
      weightCapacity: item.weightCapacity,
      armrest: item.armrest,
      headrest: item.headrest,
      recline: item.recline,
      warranty: item.warranty,
      dimensions: item.dimensions,
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      stock: item.stock,
      slug: item.slug,
      status: item.status,
      createdBy: item.createdBy?._id || null,
      createdByName: item.createdBy?.full_name || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      paginations: pagination,
    }));

    return responseSuccess(
      res,
      "Product list fetched successfully",
      formattedData,
    );
  });
export const productDetail =
  asyncHandler(async (req, res) => {
    const id = req.params.id || req.body.id;
    const slug = req.params.slug || req.body.slug;

    let filter = {};

    if (id) {
      filter._id = id;
    } else if (slug) {
      filter.slug = slug;
    }


    const product =
      await Product.findOne(filter)
        .populate(
          "category",
          "category_name"
        )
        .populate(
          "brand",
          "brand_name"
        )
        .populate(
          "createdBy",
          "full_name email"
        );

    if (!product) {
      return responseError(
        res,
        "Product not found",
        404
      );
    }

    const formattedData = {
      id: product._id,
      category:
        product.category
          ? {
            id: product.category._id,
            category_name:
              product.category
                .category_name,
          }
          : null,

      brand:
        product.brand
          ? {
            id: product.brand._id,
            brand_name:
              product.brand
                .brand_name,
          }
          : null,

      product_name: product.product_name,
      product_image: product.product_image,
      description: product.description,
      color_name: product.color_name,
      color_code: product.color_code,
      sku: product.sku,
      material: product.material,
      frameMaterial: product.frameMaterial,
      seatHeight: product.seatHeight,
      weightCapacity: product.weightCapacity,
      armrest: product.armrest,
      headrest: product.headrest,
      recline: product.recline,
      warranty: product.warranty,
      dimensions: product.dimensions,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      slug: product.slug,
      status: product.status,
      createdBy: product.createdBy?._id || null,
      createdByName: product.createdBy?.full_name || null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,

    };

    return responseSuccess(
      res,
      "Product details fetched successfully",
      formattedData
    );
  });