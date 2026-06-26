import Category from "../models/category.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";
import cloudinaryUpload from "../helpers/cloudinaryUpload.js";

export const registerCategory =
  asyncHandler(async (req, res) => {
    const {
      id,
      category_name,
    } = req.body;

    if (!category_name) {
      return responseError(
        res,
        "Category name is required",
        400
      );
    }


    if (id) {
      const categoryData = await Category.findById(id);
      if (!categoryData) {
        return responseError(
          res,
          "Category is not found",
          400
        )
      }
      categoryData.category_name = category_name;
      categoryData.status = categoryData.status;
      categoryData.createdBy = req.user.id;
      await categoryData.save();

      return responseSuccess(
        res,
        "Category updated successfully"
      );
    }

    const existingCategory =
      await Category.findOne({
        category_name
      });

    if (existingCategory) {
      return responseError(
        res,
        "Category already exists",
        400
      );
    }

    const category =
      await Category.create({
        category_name,
        createdBy: req.user.id,
      });

    return responseSuccess(
      res,
      "Category created successfully",
    );
  });

export const deleteCategory =
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

    const category =
      await Category.findById(id);

    if (!category) {
      return responseError(
        res,
        "Category not found",
        404
      );
    }

    if (status === "A") {
      category.status = "0";
    }

    if (status === "B") {
      category.status = "1";
    }

    await category.save();

    return responseSuccess(
      res,
      "Category Status Updated Successfully",
    );
  });

export const getAllCategories =
  asyncHandler(async (req, res) => {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const search = req.body.search || "";
    const skip = (page - 1) * limit;
    let filter = {};
    if (search) {
      filter.category_name = {
        $regex: search,
        $options: "i",
      };
    }

    const total = await Category.countDocuments(filter);
    const categories =
      await Category.find(filter)
        .populate(
          "createdBy",
          "full_name email"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

    const pagination = {
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      perPage: limit,
    };

    const formattedData =
      categories.map((item) => ({
        id: item._id,
        name: item.category_name,
        status: item.status,
        createdBy: item.createdBy?._id || null,
        createdByName: item.createdBy?.full_name || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        paginations: pagination,
      }));

    return responseSuccess(
      res,
      "Category list fetched successfully",
      formattedData
    );
  });