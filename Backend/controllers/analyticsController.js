import Transaction from "../models/Transaction.js";

export const getAnalyticsData = async (req, res) => {
  try {    
    const userId = req.user._id;

    //time-range filter
    const { startDate, endDate } = req.query;

    const transactionFilter = {
      user: userId,
    };

    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Both startDate and endDate are required",
        });
      }

      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      if (
        typeof startDate !== "string" ||
        typeof endDate !== "string" ||
        !datePattern.test(startDate) ||
        !datePattern.test(endDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);

      // Check real calendar dates, not just the string format.
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start.toISOString().slice(0, 10) !== startDate ||
        end.toISOString().slice(0, 10) !== endDate ||
        start > end
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date range",
        });
      }

      transactionFilter.date = {
        $gte: start,
        $lte: end,
      };
    }

    const summary = await Transaction.aggregate([
      {
        $match: transactionFilter,
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let income = 0;
    let expenses = 0;

    summary.forEach((item) => {
      if (item._id === "income") {
        income = item.total;
      }

      if (item._id === "expense") {
        expenses = item.total;
      }
    });

    const expenseStats = await Transaction.aggregate([
      {
        $match: {
          ...transactionFilter,
          type: "expense",
        },
      },
      {
        $group: {
          _id: null,
          averageExpense: { $avg: "$amount" },
          highestExpense: { $max: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
    ]);

    const categoryData = await Transaction.aggregate([
      {
        $match: {
          ...transactionFilter,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          amount: -1,
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          amount: 1,
          count: 1,
        },
      },
    ]);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          ...transactionFilter,
          type: {
            $in: ["income", "expense"],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },

          income: {
            $sum: {
              $cond: [
                { $eq: ["$type", "income"] },
                "$amount",
                0,
              ],
            },
          },

          expenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", "expense"] },
                "$amount",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          income: 1,
          expenses: 1,
          savings: {
            $subtract: ["$income", "$expenses"],
          },
        },
      },
    ]);

    const biggestExpenses = await Transaction.find({
      ...transactionFilter,
      type: "expense",
    })
      .sort({ amount: -1 })
      .limit(5)
      .lean();
      
    const highestExpenseTransaction = biggestExpenses[0] || null;

    res.status(200).json({
      success: true,

      summary: {
        income,
        expenses,
        balance: income - expenses,
        incomeExpenseRatio:
          expenses > 0 ? income / expenses : 0,
      },

      expenseStats: {
        averageExpense:
          expenseStats[0]?.averageExpense || 0,

        highestExpense:
          expenseStats[0]?.highestExpense || 0,

        expenseCount:
          expenseStats[0]?.expenseCount || 0,
      },

      categoryData,
      monthlyData,
      biggestExpenses,
      highestExpenseTransaction,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load analytics data",
    });
  }
};

