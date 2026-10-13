import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    categoryKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    monthlyLimit: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, month: 1, categoryKey: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
