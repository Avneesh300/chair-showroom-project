import Brand from "../models/brand.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";
import cloudinaryUpload from "../helpers/cloudinaryUpload.js";

export const registerBrand =
    asyncHandler(async (req, res) => {
        const {
            id,
            brand_name,
        } = req.body;

        if (!brand_name) {
            return responseError(
                res,
                "Brand name is required",
                400
            );
        }

        if (id) {
            const brandData = await Brand.findById(id);
            if (!brandData) {
                return responseError(
                    res,
                    "Brand is not found",
                    400
                )
            }
            brandData.brand_name = brand_name;
            brandData.status = brandData.status;
            brandData.createdBy = req.user.id;
            await brandData.save();

            return responseSuccess(
                res,
                "Brand updated successfully",
            );
        }

        const existingBrand =
            await Brand.findOne({
                brand_name
            });

        if (existingBrand) {
            return responseError(
                res,
                "Brand already exists",
                400
            );
        }

        const brandData =
            await Brand.create({
                brand_name,
                createdBy: req.user.id,
            });

        return responseSuccess(
            res,
            "Brand created successfully",
        );
    });

export const deleteBrand =
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

        const brandData =
            await Brand.findById(id);

        if (!brandData) {
            return responseError(
                res,
                "Category not found",
                404
            );
        }

        if (status === "A") {
            brandData.status = "0";
        }

        if (status === "B") {
            brandData.status = "1";
        }

        await brandData.save();

        return responseSuccess(
            res,
            "Brand Status Updated Successfully",
        );
    });

export const getAllBrand =
    asyncHandler(async (req, res) => {
        const page = parseInt(req.body.page) || 1;
        const limit =  parseInt(req.body.limit) || 10;
        const search = req.body.search || "";
        const skip = (page - 1) * limit;
        let filter = {};
        if (search) {
            filter.brand_name = {
                $regex: search,
                $options: "i",
            };
        }

        const total = await Brand.countDocuments( filter );
        const brands =
            await Brand.find(filter)
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
            totalPages: Math.ceil( total / limit ),
            perPage: limit,
        };

        const formattedData =
            brands.map((item) => ({
                id: item._id,
                brand_name: item.brand_name,
                status: item.status,
                createdBy: item.createdBy?._id || null,
                createdByName: item.createdBy?.full_name || null,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                paginations: pagination,
            }));

        return responseSuccess(
            res,
            "Brand list fetched successfully",
            formattedData
        );
    });