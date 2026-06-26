import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";

export const getDashboardStats = asyncHandler(async (req, res) => {

  // ========================================
  // STEP 1 — STATS CARDS (with % change)
  // ========================================

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Last week same day range
  const lastWeekTodayStart = new Date(todayStart);
  lastWeekTodayStart.setDate(lastWeekTodayStart.getDate() - 7);
  const lastWeekTodayEnd = new Date(todayEnd);
  lastWeekTodayEnd.setDate(lastWeekTodayEnd.getDate() - 7);

  // Last month start
  const lastMonthStart = new Date();
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  lastMonthStart.setDate(1);
  lastMonthStart.setHours(0, 0, 0, 0);
  const lastMonthEnd = new Date();
  lastMonthEnd.setDate(0); 
  lastMonthEnd.setHours(23, 59, 59, 999);

  // ✅ Aaj ka revenue
  const todayRevenueData = await Order.aggregate([
    { $match: { paymentStatus: "SUCCESS", createdAt: { $gte: todayStart, $lte: todayEnd } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const todayRevenue = todayRevenueData[0]?.total || 0;

  // ✅ Last week same day revenue
  const lastWeekRevenueData = await Order.aggregate([
    { $match: { paymentStatus: "SUCCESS", createdAt: { $gte: lastWeekTodayStart, $lte: lastWeekTodayEnd } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const lastWeekRevenue = lastWeekRevenueData[0]?.total || 0;

  // ✅ Total orders this week
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const totalOrdersThisWeek = await Order.countDocuments({ createdAt: { $gte: thisWeekStart } });
  const totalOrdersLastWeek = await Order.countDocuments({
    createdAt: { $gte: lastWeekTodayStart, $lte: lastWeekTodayEnd },
  });
  const totalOrders = await Order.countDocuments();

  // ✅ New customers this month vs last month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const newCustomers = await User.countDocuments({ role: "customer", createdAt: { $gte: monthStart } });
  const lastMonthCustomers = await User.countDocuments({
    role: "customer",
    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
  });

  // ✅ Low stock
  const lowStockCount = await Product.countDocuments({ stock: { $lte: 10 }, status: "1" });
  const lastWeekLowStock = 0; // Static — stock history nahi hai

  // ✅ Percentage calculate karne ka helper
  const calcPercent = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / previous) * 100;
    return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
  };
  // ========================================
  // STEP 2 — WEEKLY REVENUE CHART
  // ========================================

  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const weeklyRaw = await Order.aggregate([
    {
      $match: {
        paymentStatus: "SUCCESS",
        createdAt: { $gte: lastWeekStart },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: "$createdAt" }, // 1=Sun, 2=Mon ... 7=Sat
        amount: { $sum: "$totalAmount" },
      },
    },
  ]);

  // Har din ka data fill karo — agar kisi din order nahi tha toh 0
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyRevenue = days.map((day, i) => {
    const found = weeklyRaw.find((r) => r._id === i + 1);
    return { day, amount: found?.amount || 0 };
  });

  // ========================================
  // STEP 3 — SALES BY CATEGORY
  // ========================================

  const categoryRaw = await Order.aggregate([
    { $match: { orderStatus: { $ne: "CANCELLED" } } },
    { $unwind: "$items" }, // Ek order ke multiple items alag alag ho jaate hain
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.category", // Category ID se group
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 6 },
  ]);

  // Category IDs se names fetch karo
  const categoryIds = categoryRaw.map((c) => c._id);
  const categories = await Category.find({ _id: { $in: categoryIds } }).select("category_name");
  const maxRevenue = Math.max(...categoryRaw.map((c) => c.revenue), 1);

  const salesByCategory = categoryRaw.map((c) => {
    const cat = categories.find((d) => d._id.toString() === c._id?.toString());
    return {
      name: cat?.category_name || "Unknown",
      revenue: c.revenue,
      percentage: Math.round((c.revenue / maxRevenue) * 100),
    };
  });

  // ========================================
  // STEP 4 — RECENT ORDERS (last 5)
  // ========================================

  const recentOrdersRaw = await Order.find()
    .populate("user", "full_name")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("totalAmount orderStatus paymentStatus createdAt full_name user");

  const recentOrders = recentOrdersRaw.map((o) => ({
    id: o._id,
    customerName: o.full_name || o.user?.full_name || "Guest",
    totalAmount: o.totalAmount,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
  }));

  // ========================================
  // STEP 5 — LOW STOCK ALERT (stock <= 10)
  // ========================================

  const lowStockProducts = await Product.find({ stock: { $lte: 10 }, status: "1" })
    .populate("brand", "brand_name")
    .select("product_name product_image sku stock brand")
    .limit(10);

  const lowStock = lowStockProducts.map((p) => ({
    id: p._id,
    product_name: p.product_name,
    product_image: p.product_image,
    sku: p.sku,
    stock: p.stock,
    brand_name: p.brand?.brand_name || "",
  }));

  // ========================================
  // STEP 6 — TOP SELLING PRODUCTS
  // ========================================

  // Sabse zyada biki products nikalo orders se
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

  // Product IDs se details fetch karo
  const productIds = topSellingRaw.map((t) => t._id);
  const topProducts = await Product.find({ _id: { $in: productIds } })
    .populate("brand", "brand_name")
    .populate("category", "category_name")
    .select("product_name product_image sku stock sellingPrice brand category");

  const topSelling = topSellingRaw.map((t) => {
    const p = topProducts.find((x) => x._id.toString() === t._id.toString());
    return {
      id: t._id,
      product_name: p?.product_name || "",
      product_image: p?.product_image || "",
      sku: p?.sku || "",
      stock: p?.stock || 0,
      sellingPrice: p?.sellingPrice || 0,
      brand_name: p?.brand?.brand_name || "",
      category_name: p?.category?.category_name || "",
      totalSold: t.totalSold,
      totalRevenue: t.totalRevenue,
    };
  });

  // ========================================
  // FINAL RESPONSE
  // ========================================

  return responseSuccess(res, "Dashboard stats fetched successfully", {
    stats: {
      todayRevenue,
      todayRevenueChange: calcPercent(todayRevenue, lastWeekRevenue),        // ✅
      todayRevenueUp: todayRevenue >= lastWeekRevenue,                        // ✅

      totalOrders,
      totalOrdersChange: calcPercent(totalOrdersThisWeek, totalOrdersLastWeek), // ✅
      totalOrdersUp: totalOrdersThisWeek >= totalOrdersLastWeek,                // ✅

      newCustomers,
      newCustomersChange: calcPercent(newCustomers, lastMonthCustomers),     // ✅
      newCustomersUp: newCustomers >= lastMonthCustomers,                     // ✅

      lowStockCount,
      lowStockChange: "Needs attention",                                      // ✅ Static
      lowStockUp: false,                                                      // ✅ Always red
    },
    weeklyRevenue,
    salesByCategory,
    recentOrders,
    lowStock,
    topSelling,
  });
});