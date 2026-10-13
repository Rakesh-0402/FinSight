import mongoose from "mongoose";

const billPaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    paidAt: { type: Date, required: true, default: Date.now },
    scheduledDueDate: { type: Date, required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
  },
  { _id: true }
);

const recurringBillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, trim: true, maxlength: 50, default: "Bills & Utilities" },
    amount: { type: Number, required: true, min: 0.01 },
    frequency: { type: String, enum: ["weekly", "monthly", "yearly"], required: true, default: "monthly" },
    nextDueDate: { type: Date, required: true },
    lastPaidAt: { type: Date, default: null },
    lastPaidDueDate: { type: Date, default: null },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    notes: { type: String, trim: true, maxlength: 240, default: "" },
    status: { type: String, enum: ["active", "paused"], default: "active" },
    paymentHistory: { type: [billPaymentSchema], default: [] },
  },
  { timestamps: true }
);

recurringBillSchema.index({ user: 1, status: 1, nextDueDate: 1 });

export default mongoose.model("RecurringBill", recurringBillSchema);
