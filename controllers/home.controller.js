import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";

export const getHomeData = asyncHandler(async (req, res) => {

  // ✅ Categories with product count
  const categories = await Category.find({ status: "1" })
    .select("category_name status")
    .limit(10);

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({
        category: cat._id,
        status: "1",
      });
      return {
        id: cat._id,
        name: cat.category_name,
        productCount,
      };
    })
  );

  // ✅ Featured Products
  const featuredProducts = await Product.find({ status: "1" })
    .populate("brand", "brand_name")
    .populate("category", "category_name")
    .sort({ createdAt: -1 })
    .limit(8)
    .select("product_name product_image mrp sellingPrice stock sku slug color_name brand category");

  // ✅ New Arrivals (latest 4)
  const newArrivals = await Product.find({ status: "1" })
    .populate("brand", "brand_name")
    .populate("category", "category_name")
    .sort({ createdAt: -1 })
    .limit(4)
    .select("product_name product_image mrp sellingPrice stock sku slug color_name brand category");

  // ✅ Brands
  const brands = await Brand.find({ status: "1" })
    .select("brand_name")
    .limit(20);

  const formatProduct = (item) => ({
    id: item._id,
    product_name: item.product_name,
    product_image: item.product_image,
    mrp: item.mrp,
    sellingPrice: item.sellingPrice,
    stock: item.stock,
    sku: item.sku,
    slug: item.slug,
    color_name: item.color_name,
    brand: item.brand ? { id: item.brand._id, brand_name: item.brand.brand_name } : null,
    category: item.category ? { id: item.category._id, category_name: item.category.category_name } : null,
  });

  return responseSuccess(res, "Home data fetched successfully", {
    categories: categoriesWithCount,
    featuredProducts: featuredProducts.map(formatProduct),
    newArrivals: newArrivals.map(formatProduct),
    brands: brands.map((b) => ({ id: b._id, brand_name: b.brand_name })),
  });
});