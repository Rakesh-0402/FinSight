//query specific context retrieval
import Transaction from "../models/Transaction.js";

const MONTHS = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const CATEGORIES = [
  "Restaurants",
  "Groceries",
  "Shopping",
  "Transportation",
  "Travel",
  "Entertainment",
  "Subscription",
  "Healthcare",
  "Investment",
  "Utilities",
  "Rent",
  "Education",
  "Personal Care",
  "Transfer",
  "Fees",
  "Income",
  "EMI",
  "Insurance",
  "Mortgage",
];

const detectCategory = (question) => {
  const lower = question.toLowerCase();

  return (
    CATEGORIES.find((category) =>
      lower.includes(
        category.toLowerCase()
      )
    ) || null
  );
};

const detectMonthYear = (question) => {
  const lower = question.toLowerCase();

  let month = null;

  for (const [name, index] of Object.entries(MONTHS)) {
    if (lower.includes(name)) {
      month = index;
      break;
    }
  }

  const yearMatch =
    question.match(/\b(20\d{2})\b/);

  const year = yearMatch
    ? Number(yearMatch[1])
    : null;

  if (month === null || !year) {
    return null;
  }

  const start = new Date(
    Date.UTC(year, month, 1)
  );

  const end = new Date(
    Date.UTC(year, month + 1, 1)
  );

  return {
    month,
    year,
    start,
    end,
  };
};

const detectLastMonths = (question) => {
  const match = question
    .toLowerCase()
    .match(
      /(?:last|past)\s+(\d+)\s+months?/
    );

  if (!match) {
    return null;
  }

  return Number(match[1]);
};

export const buildQuerySpecificContext = async (
  userId,
  question
) => {
  const category =
    detectCategory(question);

  const monthPeriod =
    detectMonthYear(question);

  const lastMonths =
    detectLastMonths(question);

  /*
   * CASE 1:
   * Specific month/year
   * Example:
   * "How much did I spend on restaurants in July 2022?"
   */
  if (monthPeriod) {
    const filter = {
      user: userId,

      date: {
        $gte: monthPeriod.start,
        $lt: monthPeriod.end,
      },
    };

    if (category) {
      filter.category = category;
    }

    // Income questions should not be forced to expense
    if (
      category !== "Income"
    ) {
      filter.type = "expense";
    }

    const transactions =
      await Transaction.find(filter)
        .sort({ date: 1 })
        .select(
          "date description amount type category isAnomaly anomalyScore"
        )
        .lean();

    const total = transactions.reduce(
      (sum, transaction) =>
        sum +
        Number(transaction.amount || 0),
      0
    );

    return {
      type:
        "specific_period",

      requestedPeriod: {
        year:
          monthPeriod.year,

        month:
          monthPeriod.month + 1,
      },

      category,

      transactionCount:
        transactions.length,

      total,

      transactions,
    };
  }

  /*
   * CASE 2:
   * Last N months
   * Example:
   * "What changed in the last 7 months?"
   */
  if (lastMonths) {
    const latestTransaction =
      await Transaction.findOne({
        user: userId,
      })
        .sort({
          date: -1,
        })
        .select("date")
        .lean();

    if (!latestTransaction) {
      return {
        type: "no_data",
      };
    }

    const latestDate =
      new Date(
        latestTransaction.date
      );

    const startDate =
      new Date(
        Date.UTC(
          latestDate.getUTCFullYear(),
          latestDate.getUTCMonth() -
            (lastMonths - 1),
          1
        )
      );

    const endDate =
      new Date(
        Date.UTC(
          latestDate.getUTCFullYear(),
          latestDate.getUTCMonth() + 1,
          1
        )
      );

    const monthlyData =
      await Transaction.aggregate([
        {
          $match: {
            user: userId,

            date: {
              $gte: startDate,
              $lt: endDate,
            },

            type: {
              $in: [
                "income",
                "expense",
              ],
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$date",
              },

              month: {
                $month: "$date",
              },
            },

            income: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$type",
                      "income",
                    ],
                  },

                  "$amount",
                  0,
                ],
              },
            },

            expenses: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$type",
                      "expense",
                    ],
                  },

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

            year:
              "$_id.year",

            month:
              "$_id.month",

            income: 1,
            expenses: 1,
          },
        },
      ]);

    const categoryData =
      await Transaction.aggregate([
        {
          $match: {
            user: userId,

            type: "expense",

            date: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },

        {
          $group: {
            _id: "$category",

            amount: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
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

    return {
      type:
        "multi_month_analysis",

      requestedMonths:
        lastMonths,

      period: {
        start: startDate,
        end: endDate,
      },

      monthlyData,
      categoryData,
    };
  }

  /*
   * No special query detected
   */
  return null;
};