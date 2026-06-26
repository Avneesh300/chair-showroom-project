import Coupon from "../models/coupon.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      status: "1",
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: `This coupon will be active from ${coupon.validFrom.toLocaleDateString()}`,
      });
    }

    if (now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    if (cartTotal < coupon.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount ₹${coupon.minimumOrder} is required to use this coupon`,
        minimumOrder: coupon.minimumOrder,
        currentCartTotal: cartTotal,
        remainingAmount: coupon.minimumOrder - cartTotal,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    const finalAmount = cartTotal - discountAmount;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount,

    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const registerCoupon =
  asyncHandler(async (req, res) => {
    const {
      id,
      code,
      minimumOrder,
      discountType,
      discountValue,
      applicableProducts,
      applicableCategories,
      validFrom,
      validUntil,
    } = req.body;

    if (!code) {
      return responseError(
        res,
        "Coupon code is required",
        400
      );
    }

    if (!discountType) {
      return responseError(
        res,
        "Discount type is required",
        400
      );
    }

    if (!discountValue) {
      return responseError(
        res,
        "Discount value is required",
        400
      );
    }

    if (!validFrom) {
      return responseError(
        res,
        "Valid From is required",
        400
      );
    }

    if (!validUntil) {
      return responseError(
        res,
        "Valid Until is required",
        400
      );
    }

    if (id) {

      const couponData = await Coupon.findById(id);
      if (!couponData) {
        return responseError({
          res,
          message: "Coupan not found",

        })
      }

      couponData.code = code.toUpperCase();
      couponData.minimumOrder = minimumOrder;
      couponData.discountType = discountType;
      couponData.discountValue = discountValue;
      if (applicableProducts) {
        couponData.applicableProducts = applicableProducts;
      }
      if (applicableCategories) {
        couponData.applicableCategories = applicableCategories;
      }
      couponData.validFrom = validFrom;
      couponData.validUntil = validUntil;
      couponData.createdBy = req.user.id,
        await couponData.save();

      return responseSuccess(
        res,
        "Coupon updated successfully",
      );
    }

    const existingCoupon =
      await Coupon.findOne({
        code: code.toUpperCase(),
      });

    if (existingCoupon) {
      return responseError(
        res,
        "Coupon code already exists",
        400
      );
    }

    const coupon =
      await Coupon.create({
        code: code.toUpperCase(),
        minimumOrder,
        discountType,
        discountValue,
        applicableProducts,
        applicableCategories,
        validFrom,
        validUntil,
        createdBy: req.user.id,
      });

    return responseSuccess(
      res,
      "Coupon created successfully",
    );
  });

export const deleteCoupon =
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

    const coupon =
      await Coupon.findById(id);

    if (!coupon) {
      return responseError(
        res,
        "Coupon not found",
        404
      );
    }

    if (status === "A") {
      coupon.status = "0";
    }

    if (status === "B") {
      coupon.status = "1";
    }

    await coupon.save();

    return responseSuccess(
      res,
      "Coupon Status Updated Successfully",
    );
  });

export const getAllCoupons =
  asyncHandler(async (req, res) => {
    const page =
      parseInt(req.body.page) || 1;

    const limit =
      parseInt(req.body.limit) || 10;

    const search =
      req.body.search || "";

    const skip =
      (page - 1) * limit;

    let filter = {
      status: "1",
    };

    if (search) {
      filter.code = {
        $regex: search,
        $options: "i",
      };
    }

    const total =
      await Coupon.countDocuments(
        filter
      );

    const coupons =
      await Coupon.find(filter)
        .populate(
          "createdBy",
          "full_name email"
        )
        .populate(
          "applicableProducts",
          "product_name sku"
        )
        .populate(
          "applicableCategories",
          "category_name slug"
        )
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
      coupons.map((item) => ({
        id: item._id,

        code: item.code,

        minimumOrder:
          item.minimumOrder,

        discountType:
          item.discountType,

        discountValue:
          item.discountValue,

        applicableProducts:
          item.applicableProducts,

        applicableCategories:
          item.applicableCategories,

        validFrom:
          item.validFrom,

        validUntil:
          item.validUntil,

        status: item.status,

        createdBy:
          item.createdBy?._id ||
          null,

        createdByName:
          item.createdBy
            ?.full_name || null,

        createdAt:
          item.createdAt,

        updatedAt:
          item.updatedAt,

        paginations:
          pagination,
      }));

    return responseSuccess(
      res,
      "Coupon list fetched successfully",
      formattedData
    );
  });