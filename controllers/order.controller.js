import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";

export const createOrder = asyncHandler(
  async (req, res) => {
    const {
      full_name,
      mobile,
      city,
      state,
      pincode,
      address,
      items,
      subtotal,
      shippingCharge = 0,
      discountAmount = 0,
      totalAmount,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (!full_name) {
      return responseError(res, "Fullname is required", 400);
    }

    if (!mobile) {
      return responseError(res, "Mobile is required", 400);
    }

    if (!city) {
      return responseError(res, "City is required", 400);
    }

    if (!state) {
      return responseError(res, "State is required", 400);
    }

    if (!pincode) {
      return responseError(res, "Pincode is required", 400);
    }

    if (!address) {
      return responseError(res, "Address is required", 400);
    }

    if (!items || !items.length) {
      return responseError(res, "Items are required", 400);
    }

    if (subtotal == null) {
      return responseError(res, "Subtotal is required", 400);
    }

    if (totalAmount == null) {
      return responseError(res, "TotalAmount is required", 400);
    }

    // ✅ Online payment verify karo agar payment fields hain
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      const sign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (sign !== razorpay_signature) {
        return responseError(res, "Payment verification failed", 400);
      }
    }

    const order = await Order.create({
      user: req.user.id,
      full_name, mobile, city, state, pincode, address,
      items,
      subtotal, shippingCharge, discountAmount, totalAmount,
      // ✅ Payment success toh status update
      paymentStatus: razorpay_payment_id ? "SUCCESS" : "PENDING",
      orderStatus: razorpay_payment_id ? "PROCESSING" : "PLACED",
      razorpayPaymentId: razorpay_payment_id || null,
      razorpayOrderId: razorpay_order_id || null,
    });

    // ✅ Online payment ke baad cart clear karo
    if (razorpay_payment_id) {
      await Cart.deleteMany({ user: req.user.id });
    }

    return responseSuccess(
      res,
      "Order created successfully",
      order
    );
  }
);

export const getAllOrders = asyncHandler(
  async (req, res) => {
    const page =
      parseInt(req.body.page) || 1;

    const limit =
      parseInt(req.body.limit) || 10;

    const skip =
      (page - 1) * limit;
    const myOrdersOnly = req.body.myOrdersOnly || false;

    let filter = {};

    if (myOrdersOnly || req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    const orders = await Order.find(filter)
      .populate(
        "user",
        "full_name email mobile"
      )
      .populate(
        "items.product",
        "product_name"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total =
      await Order.countDocuments(
        filter
      );

    const formattedData =
      orders.map((order) => ({
        id: order._id,

        customer: {
          id:
            order.user?._id,
          full_name:
            order.user
              ?.full_name,
          email:
            order.user
              ?.email,
          mobile:
            order.user
              ?.mobile,
        },

        paymentStatus:
          order.paymentStatus,

        orderStatus:
          order.orderStatus,

        subtotal:
          order.subtotal,

        shippingCharge:
          order.shippingCharge,

        discountAmount:
          order.discountAmount,

        totalAmount:
          order.totalAmount,

        totalItems:
          order.items.length,

        createdAt:
          order.createdAt,
      }));

    return responseSuccess(
      res,
      "Orders fetched successfully",
      {
        orders: formattedData,
        pagination: {
          total,
          currentPage: page,
          totalPages: Math.ceil(
            total / limit
          ),
          perPage: limit,
        },
      }
    );
  }
);


export const orderDetail = asyncHandler(
  async (req, res) => {
    const { id } = req.body;

    if (!id) {
      return responseError(
        res,
        "Order Id is required",
        400
      );
    }

    const order =
      await Order.findById(id)
        .populate(
          "items.product"
        );

    if (!order) {
      return responseError(
        res,
        "Order not found",
        404
      );
    }

    const formattedData = {
      id: order._id,

      full_name:
        order.full_name,

      mobile:
        order.mobile,

      city:
        order.city,

      state:
        order.state,

      pincode:
        order.pincode,

      address:
        order.address,

      paymentStatus:
        order.paymentStatus,

      orderStatus:
        order.orderStatus,

      subtotal:
        order.subtotal,

      shippingCharge:
        order.shippingCharge,

      discountAmount:
        order.discountAmount,

      totalAmount:
        order.totalAmount,

      items:
        order.items.map(
          (item) => ({
            productId:
              item.product?._id,

            productName:
              item.product?.product_name,
            productImage: item.product?.product_image,

            quantity:
              item.quantity,

            price:
              item.price,
          })
        ),

      createdAt:
        order.createdAt,

      updatedAt:
        order.updatedAt,
    };

    return responseSuccess(
      res,
      "Order fetched successfully",
      formattedData
    );
  }
);


export const orderStatusUpdate =
  asyncHandler(
    async (req, res) => {
      const {
        id,
        orderStatus,
      } = req.body;

      if (!id) {
        return responseError(
          res,
          "Order Id is required",
          400
        );
      }

      if (!orderStatus) {
        return responseError(
          res,
          "Order Status is required",
          400
        );
      }

      const order =
        await Order.findById(id);

      if (!order) {
        return responseError(
          res,
          "Order not found",
          404
        );
      }

      const validStatuses = [
        "PLACED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ];

      if (
        !validStatuses.includes(
          orderStatus
        )
      ) {
        return responseError(
          res,
          "Invalid order status",
          400
        );
      }

      order.orderStatus =
        orderStatus;

      await order.save();

      return responseSuccess(
        res,
        "Order status updated successfully",
        order
      );
    }
  );

export const createPaymentOrder =
  asyncHandler(async (req, res) => {

    const { orderId } = req.body;

    const order =
      await Order.findById(orderId);

    if (!order) {
      return responseError(
        res,
        "Order not found",
        404
      );
    }

    const options = {
      amount:
        order.totalAmount * 100,
      currency: "INR",
      receipt:
        order._id.toString(),
    };

    const razorpayOrder =
      await razorpay.orders.create(
        options
      );

    order.razorpayOrderId =
      razorpayOrder.id;

    await order.save();

    return responseSuccess(
      res,
      "Payment order created",
      razorpayOrder
    );
  });


export const verifyPayment =
  asyncHandler(async (req, res) => {

    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    const sign =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          razorpay_order_id +
          "|" +
          razorpay_payment_id
        )
        .digest("hex");

    if (
      sign !==
      razorpay_signature
    ) {
      return responseError(
        res,
        "Payment verification failed",
        400
      );
    }

    await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "SUCCESS",
        orderStatus: "PROCESSING",
        razorpayPaymentId:
          razorpay_payment_id,
        razorpayOrderId:
          razorpay_order_id,
      }
    );

    await Cart.deleteMany({
      user: req.user.id,
    });

    return responseSuccess(
      res,
      "Payment verified successfully"
    );
  });

// order.controller.js mein add karo
export const createTempPaymentOrder =
  asyncHandler(async (req, res) => {
    const { amount } = req.body;
    if (!amount) {
      return responseError(res, "Amount is required", 400);
    }
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `temp_${Date.now()}`,
    };
    const razorpayOrder = await razorpay.orders.create(options);
    return responseSuccess(res, "Payment order created", razorpayOrder);
  });

export const paymentStatusUpdate = asyncHandler(async (req, res) => {
  const { id, paymentStatus } = req.body;

  if (!id) {
    return responseError(res, "Order Id is required", 400);
  }

  if (!paymentStatus) {
    return responseError(res, "Payment Status is required", 400);
  }

  const order = await Order.findById(id);

  if (!order) {
    return responseError(res, "Order not found", 404);
  }

  const validStatuses = ["PENDING", "SUCCESS", "FAILED"];

  if (!validStatuses.includes(paymentStatus)) {
    return responseError(res, "Invalid payment status", 400);
  }

  order.paymentStatus = paymentStatus;
  await order.save();

  return responseSuccess(res, "Payment status updated successfully", order);
});