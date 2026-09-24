//model for confirmed zero -expense months
import mongoose from "mongoose";

const expenseMonthConfirmationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
      validate: Number.isInteger,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      validate: Number.isInteger,
    },
  },
  {
    timestamps: true,
  }
);

// A user can confirm each calendar month only once.
expenseMonthConfirmationSchema.index(
  { user: 1, year: 1, month: 1 },
  { unique: true }
);

const ExpenseMonthConfirmation = mongoose.model(
  "ExpenseMonthConfirmation",
  expenseMonthConfirmationSchema
);

export default ExpenseMonthConfirmation;