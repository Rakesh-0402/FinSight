//add the api that lets user confirm a zero-expense month

import ExpenseMonthConfirmation from "../models/ExpenseMonthConfirmation.js";
import Transaction from "../models/Transaction.js";

const validateMonth = (year, month) => {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  if (
    !Number.isInteger(parsedYear) ||
    !Number.isInteger(parsedMonth) ||
    parsedYear < 2000 ||
    parsedYear > 2100 ||
    parsedMonth < 1 ||
    parsedMonth > 12
  ) {
    return null;
  }

  const now = new Date();

  // Match the UTC calendar convention used by the forecast aggregation.
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  if (
    parsedYear > currentYear ||
    (parsedYear === currentYear && parsedMonth > currentMonth)
  ) {
    return null;
  }

  return { year: parsedYear, month: parsedMonth };
};

// POST /api/forecast/zero-months
export const confirmZeroExpenseMonth = async (req, res) => {
  try {
    const validated = validateMonth(req.body.year, req.body.month);

    if (!validated) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid month that is not in the future",
      });
    }

    const { year, month } = validated;
    const userId = req.user._id;

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    // A month with actual expenses cannot be confirmed as zero.
    const existingExpense = await Transaction.exists({
      user: userId,
      type: "expense",
      date: {
        $gte: monthStart,
        $lt: nextMonthStart,
      },
    });

    if (existingExpense) {
      return res.status(409).json({
        success: false,
        message:
          "This month already contains recorded expenses and cannot be marked as zero.",
      });
    }

    await ExpenseMonthConfirmation.findOneAndUpdate(
      { user: userId, year, month },
      { $setOnInsert: { user: userId, year, month } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Zero-expense month confirmed",
      year,
      month,
    });
  } catch (error) {
    console.error("Confirm zero-expense month error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm zero-expense month",
    });
  }
};

// DELETE /api/forecast/zero-months/:year/:month
export const removeZeroExpenseMonth = async (req, res) => {
  try {
    const validated = validateMonth(
      req.params.year,
      req.params.month
    );

    if (!validated) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    const { year, month } = validated;

    await ExpenseMonthConfirmation.deleteOne({
      user: req.user._id,
      year,
      month,
    });

    return res.status(200).json({
      success: true,
      message: "Zero-expense confirmation removed",
    });
  } catch (error) {
    console.error("Remove zero-expense month error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove zero-expense confirmation",
    });
  }
};