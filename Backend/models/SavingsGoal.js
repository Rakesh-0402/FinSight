import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, maxlength: 160, default: "" },
    date: { type: Date, required: true, default: Date.now },
  },
  { _id: true }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    contributions: { type: [contributionSchema], default: [] },
  },
  { timestamps: true }
);

savingsGoalSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("SavingsGoal", savingsGoalSchema);
