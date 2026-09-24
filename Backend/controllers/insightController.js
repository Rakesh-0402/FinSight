import Transaction from "../models/Transaction.js";

export const getFinancialContext = async (req, res) => {
  try {
    // Summary
    const summaryData = await Transaction.aggregate([
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

    summaryData.forEach((item) => {
      if (item._id === "income") {
        income = item.total;
      }

      if (item._id === "expense") {
        expenses = item.total;
      }
    });

    // Spending by category
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
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

    // Monthly spending
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
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
        },
      },
    ]);

    // Biggest expenses
    const biggestExpenses = await Transaction.find({
      user : req.user._id,
      type: "expense",
    })
      .sort({ amount: -1 })
      .limit(5)
      .select(
        "description amount category date"
      )
      .lean();

    // Anomalies
    const anomalies = await Transaction.find({
      user : req.user._id,
      isAnomaly: true,
    })
      .sort({ anomalyScore: -1 })
      .limit(10)
      .select(
        "description amount category date anomalyScore"
      )
      .lean();

    // Recent transactions
    const recentTransactions =
      await Transaction.find({user : req.user._id})
        .sort({
          date: -1,
          createdAt: -1,
        })
        .limit(20)
        .select(
          "description amount type category date"
        )
        .lean();

    res.status(200).json({
      success: true,

      context: {
        summary: {
          income,
          expenses,
          balance: income - expenses,
        },

        categorySpending,

        monthlyData,

        biggestExpenses,

        anomalies,

        recentTransactions,
      },
    });
  } catch (error) {
    console.error(
      "Financial context error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to build financial context",
    });
  }
};