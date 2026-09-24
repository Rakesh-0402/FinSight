import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";
import UploadHistory from "../models/UploadHistory.js";
// Reusable anomaly detection helper
const updateAnomalies = async (userId) => {
  const transactions = await Transaction.find({
    user: userId,
    type: "expense",
  }).lean();

  if (transactions.length < 10) {//anomaly detection requires enough spending history 
    return {
      updated: 0,
      anomaliesDetected: 0,
    };
  }

  const payload = transactions.map((transaction) => ({
    id: transaction._id.toString(),
    amount: Number(transaction.amount),
    category: transaction.category || "Other",
  }));

  const response = await fetch(
    `${process.env.AI_SERVICE_URL}/detect-anomalies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactions: payload,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Anomaly detection failed: ${errorText}`
    );
  }

  const data = await response.json();

  const anomalies = data.anomalies || [];

  const operations = [
  // Clear all previous flags for this user's expenses.
  {
    updateMany: {
      filter: {
        user: userId,
        type: "expense",
      },
      update: {
        $set: {
          isAnomaly: false,
          anomalyScore: 0,
        },
      },
    },
  },

  // Apply the latest model results.
  ...anomalies.map((result) => ({
    updateOne: {
      filter: {
        _id: result.id,
        user: userId,
        type: "expense",
      },
      update: {
        $set: {
          isAnomaly: result.isAnomaly,
          anomalyScore: result.anomalyScore,
        },
      },
    },
  })),
];

await Transaction.bulkWrite(operations, { ordered: true });

const anomaliesDetected = anomalies.filter(
  (item) => item.isAnomaly
).length;

  return {
    updated: operations.length,
    anomaliesDetected,
  };
};


// Create transaction
export const createTransaction = async (req, res) => {
  try {
    const { description, amount, date} = req.body;

    if (!description || !amount || !date) {
      return res.status(400).json({
        success: false,
        message:
          "Description, amount and date are required",
      });
    }

    let category = "Other";
    let confidence = null;

    // Ask FastAPI to categorize
    try {
      const response = await fetch(
        `${process.env.AI_SERVICE_URL}/categorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        category = data.category || "Other";
        confidence = data.confidence ?? null;
      } else {
        console.error(
          "AI categorization failed:",
          await response.text()
        );
      }
    } catch (aiError) {
      console.error(
        "Could not connect to AI service:",
        aiError.message
      );
    }
const transaction = await Transaction.create({
  user: req.user._id,
  description,
  amount: Number(amount),
  date,
  type: "expense",
  category,
  source: "manual",
  confidence,
  isAnomaly: false,
  anomalyScore: 0,
});

// Automatically rerun anomaly detection
try {
  await updateAnomalies(req.user._id);

  // Fetch the transaction again because
  // updateAnomalies may have changed isAnomaly/anomalyScore
  const updatedTransaction =
    await Transaction.findOne({
      _id : transaction._id,
      user : req.user._id,
});

  if (updatedTransaction?.isAnomaly === true) {
    await Notification.create({
      user: req.user._id,
      type: "anomaly",
      title: "Unusual spending detected",
      message: `Your ₹${Number(
        updatedTransaction.amount
      ).toLocaleString(
        "en-IN"
      )} expense for ${
        updatedTransaction.description
      } was detected as unusual.`,
      link: "/anomalies",
    });
  }
} catch (error) {
  console.error(
    "Automatic anomaly detection error:",
    error.message
  );
}

return res.status(201).json({
  success: true,
  message: "Expense added successfully",
  transaction,
});
   
  } catch (error) {
    console.error(
      "Add expense error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to add expense",
    });
  }
};


// Retrieve transactions
export const getTransactions = async (req,res) => {
  try {
    const {startDate,endDate} = req.query;

    const filter = {
      user: req.user._id,
    };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(
          `${startDate}T00:00:00.000Z`
        ),
        $lte: new Date(
          `${endDate}T23:59:59.999Z`
        ),
      };
    }

    const transactions =
      await Transaction.find(filter)
        .sort({
          date: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count:
        transactions.length,
      transactions,
    });
  } catch (error) {
    console.error(
      "Fetch transactions error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch transactions",
    });
  }
};



// Manually trigger anomaly detection
export const runAnomalyDetection = async (
  req,
  res
) => {
  try {
    const result =
      await updateAnomalies(req.user._id);

    res.status(200).json({
      success: true,
      message:
        "Anomaly detection completed",
      updated: result.updated,
      anomaliesDetected:
        result.anomaliesDetected,
    });
  } catch (error) {
    console.error(
      "Anomaly detection error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to run anomaly detection",
    });
  }
};

//delete individual transaction
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete transaction error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
};

//delete all transactions
export const deleteAllTransactions = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Transaction.deleteMany({
      user: userId,
    });

    // Remove upload history too,
    // otherwise old CSVs may still be treated as duplicates
    await UploadHistory.deleteMany({
      user: userId,
    });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: "All transactions deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete all transactions error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete transactions",
    });
  }
};

//time -range filter for anomalies
// Retrieve detected anomalies
export const getAnomalies = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      user: req.user._id,
      isAnomaly: true,
      type: "expense",
    };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(
          `${startDate}T00:00:00.000Z`
        ),
        $lte: new Date(
          `${endDate}T23:59:59.999Z`
        ),
      };
    }

    const anomalies =
      await Transaction.find(filter)
        .sort({
          date: -1,
          anomalyScore: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: anomalies.length,
      anomalies,
    });
  } catch (error) {
    console.error(
      "Fetch anomalies error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch anomalies",
    });
  }
};