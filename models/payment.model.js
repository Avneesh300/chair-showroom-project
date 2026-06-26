import mongoose from "mongoose";

const paymentSchema =
  new mongoose.Schema(
    {
      order: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Order",
      },

      amount: Number,

      transactionId: String,

      paymentMethod: String,

      status: String,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Payment",
  paymentSchema
);