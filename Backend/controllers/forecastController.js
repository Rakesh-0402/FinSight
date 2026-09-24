
import Transaction from "../models/Transaction.js";
import ExpenseMonthConfirmation from "../models/ExpenseMonthConfirmation.js";

export const getForecast = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    const monthKey = (year, month) => `${year}-${month}`;

    // Fetch all recorded expense months and zero confirmations.
    const [recordedMonths, confirmedMonths] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: "expense",
            date: {
              $lt: new Date(
                Date.UTC(currentYear, currentMonth, 1)
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            expenses: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            expenses: 1,
          },
        },
      ]),

      ExpenseMonthConfirmation.find({
        user: userId,
      }).lean(),
    ]);

    const recordedMap = new Map(
      recordedMonths.map((item) => [
        monthKey(item.year, item.month),
        item.expenses,
      ])
    );

    const confirmedSet = new Set(
      confirmedMonths.map((item) =>
        monthKey(item.year, item.month)
      )
    );

    // Find the earliest known month.
    const allKnownMonths = [
      ...recordedMonths,
      ...confirmedMonths,
    ];

    const earliestMonthNumber = allKnownMonths.length
      ? Math.min(
          ...allKnownMonths.map(
            ({ year, month }) => year * 12 + month
          )
        )
      : currentYear * 12 + currentMonth;

    const currentMonthNumber =
      currentYear * 12 + currentMonth;

    const getMonth = (monthNumber) => ({
      year: Math.floor((monthNumber - 1) / 12),
      month: ((monthNumber - 1) % 12) + 1,
    });

    const getKnownMonth = ({ year, month }) => {
      const key = monthKey(year, month);

      // Actual expenses take precedence.
      if (recordedMap.has(key)) {
        return {
          year,
          month,
          expenses: recordedMap.get(key),
          status: "recorded",
        };
      }

      if (confirmedSet.has(key)) {
        return {
          year,
          month,
          expenses: 0,
          status: "confirmed_zero",
        };
      }

      return null;
    };

    // Collect every consecutive known month, moving backward
    // from the current month. Stop at the first unknown month.
    const continuousHistory = [];

    for (
      let monthNumber = currentMonthNumber;
      monthNumber >= earliestMonthNumber;
      monthNumber--
    ) {
      const month = getMonth(monthNumber);
      const knownMonth = getKnownMonth(month);

      if (!knownMonth) {
        break;
      }

      continuousHistory.push(knownMonth);
    }

    // Restore chronological order for Python and the chart.
    const historicalData = continuousHistory.reverse();

    // Six consecutive known months are the minimum.
    if (historicalData.length < 6) {
      const missingMonths = [];

      // Show users exactly which months they need to complete
      // within the latest six-month requirement.
      for (let offset = 5; offset >= 0; offset--) {
        const month = getMonth(currentMonthNumber - offset);

        if (!getKnownMonth(month)) {
          missingMonths.push(month);
        }
      }

      return res.status(200).json({
        success: false,
        message:
          "More recent spending history needed. Upload missing transactions or confirm months when you had no expenses.",
        historicalData,
        missingMonths,
        forecast: [],
      });
    }

    // Send the entire continuous history, not just six months.
    const response = await fetch(
      `${process.env.AI_SERVICE_URL}/forecast-expenses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monthlyData: historicalData.map(
            ({ year, month, expenses }) => ({
              year,
              month,
              expenses,
            })
          ),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Forecast service failed:",
        errorText
      );

      return res.status(500).json({
        success: false,
        message: "AI forecast service failed",
      });
    }

    const forecastData = await response.json();

    if (!forecastData.success || !forecastData.forecast?.length) {
      return res.status(200).json({
        success: false,
        message:
          forecastData.message || "Unable to generate forecast",
        historicalData,
        missingMonths: [],
        forecast: [],
      });
    }

    return res.status(200).json({
      success: true,
      historicalData,
      missingMonths: [],
      forecast: forecastData.forecast,
      historicalMonths: historicalData.length,
    });
  } catch (error) {
    console.error("Forecast error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate forecast",
    });
  }
};