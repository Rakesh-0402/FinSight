import Transaction from "../models/Transaction.js";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    //time-range filter
    const {startDate,endDate,} = req.query;

    const transactionFilter = {
      user: userId,
    };

    if (startDate && endDate) {
      transactionFilter.date = {
        $gte: new Date(
          `${startDate}T00:00:00.000Z`
        ),

        $lte: new Date(
          `${endDate}T23:59:59.999Z`
        ),
      };
    }

    // 1. SUMMARY
    const summary = await Transaction.aggregate([
      {
        $match:  transactionFilter,
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
    let transfers = 0;
    let transactionCount = 0;

    summary.forEach((item) => {
      transactionCount += item.count;

      if (item._id === "income") {
        income = item.total;
      }

      if (item._id === "expense") {
        expenses = item.total;
      }

      if (item._id === "transfer") {
        transfers = item.total;
      }
    });

    const balance = income - expenses;

    // 2. EXPENSES BY CATEGORY
    const categorySpending = await Transaction.aggregate([
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

    // 3. MONTHLY INCOME / EXPENSES
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
        },
      },
    ]);

    // 4. RECENT TRANSACTIONS
    const recentTransactions = await Transaction.find({
      ...transactionFilter,
    })
      .sort({
        date: -1,
        createdAt: -1,
      })
      .limit(10)
      .lean();

    // 5. RESPONSE
    res.status(200).json({
      success: true,

      summary: {
        income,
        expenses,
        balance,
        transfers,
        transactionCount,
      },

      categorySpending,
      monthlyData,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};