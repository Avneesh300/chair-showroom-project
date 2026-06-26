import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";

export const getReportStats = asyncHandler(async (req, res) => {

  // ========================================
  // STEP 1 — Summary KPIs
  // ========================================

  const totalRevenueData = await Order.aggregate([
    { $match: { paymentStatus: "SUCCESS" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue = totalRevenueData[0]?.total || 0;
  const totalOrders = await Order.countDocuments({ paymentStatus: "SUCCESS" });
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // ========================================
  // STEP 2 — Monthly Revenue (last 6 months)
  // ========================================

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRaw = await Order.aggregate([
    { $match: { paymentStatus: "SUCCESS", createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySales = monthlyRaw.map((m) => ({
    month: monthNames[m._id.month - 1],
    revenue: m.revenue,
    orders: m.orders,
  }));

  // ========================================
  // STEP 3 — Payment Methods Breakdown
  // ========================================

  // COD orders
  const codCount = await Order.countDocuments({ paymentStatus: "PENDING", orderStatus: { $ne: "CANCELLED" } });
  // Online orders
  const onlineCount = await Order.countDocuments({ paymentStatus: "SUCCESS" });
  const totalPaymentOrders = codCount + onlineCount;

  const paymentBreakdown = [
    {
      method: "Online Payment",
      count: onlineCount,
      pct: totalPaymentOrders > 0 ? Math.round((onlineCount / totalPaymentOrders) * 100) : 0,
    },
    {
      method: "Cash on Delivery",
      count: codCount,
      pct: totalPaymentOrders > 0 ? Math.round((codCount / totalPaymentOrders) * 100) : 0,
    },
  ];

  // ========================================
  // STEP 4 — Top Products
  // ========================================

  const topSellingRaw = await Order.aggregate([
    { $match: { orderStatus: { $ne: "CANCELLED" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  const productIds = topSellingRaw.map((t) => t._id);
  const topProductsData = await Product.find({ _id: { $in: productIds } })
    .populate("brand", "brand_name")
    .populate("category", "category_name")
    .select("product_name product_image sku stock sellingPrice mrp brand category");

  const topProducts = topSellingRaw.map((t) => {
    const p = topProductsData.find((x) => x._id.toString() === t._id.toString());
    return {
      id: t._id,
      product_name: p?.product_name || "",
      product_image: p?.product_image || "",
      sku: p?.sku || "",
      stock: p?.stock || 0,
      sellingPrice: p?.sellingPrice || 0,
      mrp: p?.mrp || 0,
      brand_name: p?.brand?.brand_name || "",
      category_name: p?.category?.category_name || "",
      totalSold: t.totalSold,
      totalRevenue: t.totalRevenue,
    };
  });

  // ========================================
  // STEP 5 — Inventory Status
  // ========================================

  const totalProducts = await Product.countDocuments();
  const inStock = await Product.countDocuments({ stock: { $gt: 10 } });
  const lowStock = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 } });
  const outOfStock = await Product.countDocuments({ stock: 0 });

  return responseSuccess(res, "Report stats fetched successfully", {
    summary: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
    },
    monthlySales,
    paymentBreakdown,
    topProducts,
    inventory: {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
    },
  });
});

// ========================================
// Export APIs — CSV data return karo
// ========================================

export const exportOrdersReport = asyncHandler(async (req, res) => {
  const orders = await Order.find({ paymentStatus: "SUCCESS" })
    .populate("user", "full_name mobile")
    .sort({ createdAt: -1 })
    .select("full_name mobile city totalAmount orderStatus paymentStatus createdAt items");

  const data = orders.map((o) => ({
    order_id: String(o._id).slice(-8).toUpperCase(),
    customer: o.full_name || o.user?.full_name || "Guest",
    mobile: o.mobile || o.user?.mobile || "",
    city: o.city || "",
    date: new Date(o.createdAt).toLocaleDateString("en-IN"),
    items: o.items?.length || 0,
    total: o.totalAmount,
    payment_status: o.paymentStatus,
    order_status: o.orderStatus,
  }));

  return responseSuccess(res, "Orders report fetched", data);
});

export const exportInventoryReport = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate("brand", "brand_name")
    .populate("category", "category_name")
    .select("product_name sku stock sellingPrice mrp brand category");

  const data = products.map((p) => ({
    sku: p.sku,
    product_name: p.product_name,
    brand: p.brand?.brand_name || "",
    category: p.category?.category_name || "",
    mrp: p.mrp,
    sellingPrice: p.sellingPrice,
    stock: p.stock,
    stock_status: p.stock === 0 ? "Out of Stock" : p.stock <= 10 ? "Low Stock" : "In Stock",
  }));

  return responseSuccess(res, "Inventory report fetched", data);
});