import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  // General
  store_name: { type: String, default: "SRS Chair Showroom" },
  contact_email: { type: String, default: "" },
  contact_phone: { type: String, default: "" },
  store_address: { type: String, default: "" },
  gstin: { type: String, default: "" },
  instagram_url: { type: String, default: "" },
  facebook_url: { type: String, default: "" },
  whatsapp_number: { type: String, default: "" },

  // Shipping
  shipping_rate: { type: Number, default: 299 },
  free_shipping_above: { type: Number, default: 5000 },
  cod_enabled: { type: Boolean, default: true },
  delivery_days: { type: String, default: "3-5 working days" },

  // Payment
  razorpay_key_id: { type: String, default: "" },
  razorpay_key_secret: { type: String, default: "" },
  razorpay_webhook_secret: { type: String, default: "" },

  // Notifications
  notify_order_placed: { type: Boolean, default: true },
  notify_order_shipped: { type: Boolean, default: true },
  notify_out_for_delivery: { type: Boolean, default: true },
  notify_order_delivered: { type: Boolean, default: true },
  notify_low_stock: { type: Boolean, default: true },
  notify_new_customer: { type: Boolean, default: true },
  notify_price_drop: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Setting", settingSchema);