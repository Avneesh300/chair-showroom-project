import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";
import mongoose from "mongoose";

export const registerReview =
    asyncHandler(async (req, res) => {
        const { orderId, productId, rating, review } = req.body;

        if (!orderId) return responseError(res, "Order Id is required", 400);
        if (!productId) return responseError(res, "Product Id is required", 400);
        if (!rating) return responseError(res, "Rating is required", 400);
        if (rating < 1 || rating > 5) return responseError(res, "Rating must be between 1 and 5", 400);

        // ✅ FIX
        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id,
        });

        if (!order) return responseError(res, "Order not found", 404);

        if (order.orderStatus !== "DELIVERED") {
            return responseError(res, "Review can be submitted only after delivery", 400);
        }

        const hasProduct = order.items.some(
            (item) => item.product.toString() === productId
        );

        if (!hasProduct) return responseError(res, "Product not found in order", 400);

        // ✅ FIX
        const existingReview = await Review.findOne({
            user: req.user.id,
            product: productId,
            order: orderId,
        });

        if (existingReview) return responseError(res, "Review already submitted", 400);

        // ✅ FIX
        const newReview = await Review.create({
            user: req.user.id,
            product: productId,
            order: orderId,
            rating,
            review,
        });

        return responseSuccess(res, "Review submitted successfully", newReview);
    });

export const getProductReviews =
    asyncHandler(async (req, res) => {
        const { productId } = req.body;

        const page =
            parseInt(req.body.page) || 1;

        const limit =
            parseInt(req.body.limit) || 10;

        const skip =
            (page - 1) * limit;

        if (!productId) {
            return responseError(
                res,
                "Product Id is required",
                400
            );
        }

        const filter = {
            product: productId,
            status: "1",
        };

        const total =
            await Review.countDocuments(
                filter
            );

        const reviews =
            await Review.find(filter)
                .populate(
                    "user",
                    "full_name"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit);

        const averageRatingData =
            await Review.aggregate([
                {
                    $match: {
                        product:
                            new mongoose.Types.ObjectId(
                                productId
                            ),
                        status: "1",
                    },
                },
                {
                    $group: {
                        _id: null,
                        averageRating: {
                            $avg: "$rating",
                        },
                        totalReviews: {
                            $sum: 1,
                        },
                    },
                },
            ]);

        const averageRating =
            averageRatingData.length > 0
                ? Number(
                    averageRatingData[0].averageRating.toFixed(
                        1
                    )
                )
                : 0;

        const totalReviews =
            averageRatingData.length > 0
                ? averageRatingData[0]
                    .totalReviews
                : 0;

        const pagination = {
            total,
            currentPage: page,
            totalPages: Math.ceil(
                total / limit
            ),
            perPage: limit,
        };

        const formattedData =
            reviews.map((item) => ({
                id: item._id,

                userId:
                    item.user?._id || null,

                userName:
                    item.user
                        ?.full_name || "",

                rating:
                    item.rating,

                review:
                    item.review,

                status:
                    item.status,

                createdAt:
                    item.createdAt,

                updatedAt:
                    item.updatedAt,
            }));

        return responseSuccess(
            res,
            "Reviews fetched successfully",
            {
                averageRating,
                totalReviews,
                reviews:
                    formattedData,
                pagination,
            }
        );
    });

export const deleteReview =
  asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) return responseError(res, "Review Id is required", 400);

    const review = await Review.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!review) return responseError(res, "Review not found", 404);

    // ✅ Database se permanently delete karo
    await Review.deleteOne({ _id: id });

    return responseSuccess(res, "Review deleted successfully");
  });