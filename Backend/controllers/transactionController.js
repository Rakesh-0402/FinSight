import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";
import UploadHistory from "../models/UploadHistory.js";
import Account from "../models/Account.js";
import mongoose from "mongoose";

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
    const {
      description,
      amount,
      date,
      type,
      account,
      transferAccount,
    } = req.body;

    const numericAmount = Number(amount);

    if (
      !description ||
      !date ||
      !account ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description, valid amount, date and account are required",
      });
    }

    const validTypes = [
      "income",
      "expense",
      "transfer",
      "credit_card_payment",
      "refund",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    if (!mongoose.isValidObjectId(account)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source account",
      });
    }

    const sourceAccount = await Account.findOne({
      _id: account,
      user: req.user._id,
      isActive: true,
    });

    if (!sourceAccount) {
      return res.status(404).json({
        success: false,
        message: "Source account not found",
      });
    }

    let destinationAccount = null;

    if (
      ["transfer", "credit_card_payment"].includes(type)
    ) {
      if (
        !transferAccount ||
        !mongoose.isValidObjectId(transferAccount)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid destination account is required",
        });
      }

      if (
        sourceAccount._id.toString() ===
        transferAccount.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Source and destination accounts cannot be the same",
        });
      }

      destinationAccount = await Account.findOne({
        _id: transferAccount,
        user: req.user._id,
        isActive: true,
      });

      if (!destinationAccount) {
        return res.status(404).json({
          success: false,
          message: "Destination account not found",
        });
      }
    }

    // Normal transfers should only move money
    // between bank/cash/wallet accounts.
    if (
      type === "transfer" &&
      (
        sourceAccount.type === "credit_card" ||
        destinationAccount?.type === "credit_card"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Use Credit Card Payment when transferring money to a credit card",
      });
    }

    // Credit-card payment:
    // source = bank/cash/wallet
    // destination = credit card
    if (type === "credit_card_payment") {
      if (sourceAccount.type === "credit_card") {
        return res.status(400).json({
          success: false,
          message:
            "Credit card payment source cannot be another credit card",
        });
      }

      if (destinationAccount?.type !== "credit_card") {
        return res.status(400).json({
          success: false,
          message:
            "Credit card payment destination must be a credit card",
        });
      }
    }

    if (
      type === "income" &&
      sourceAccount.type === "credit_card"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Income cannot be added directly to a credit card",
      });
    }

    let category = "Other";
    let confidence = null;

    // AI categorization only for spending/refunds.
    if (["expense", "refund"].includes(type)) {
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
    }

    if (type === "income") {
      category = "Income";
    }

    if (type === "transfer") {
      category = "Transfer";
    }

    if (type === "credit_card_payment") {
      category = "Credit Card Payment";
    }

    const session = await mongoose.startSession();

    let transaction;

    try {
      await session.withTransaction(async () => {
        const createdTransactions =
          await Transaction.create(
            [
              {
                user: req.user._id,
                account: sourceAccount._id,
                transferAccount: destinationAccount?._id || null,
                description,
                amount: numericAmount,
                date,
                type,
                category,
                source: "manual",
                confidence,
                isAnomaly: false,
                anomalyScore: 0,
                balanceApplied: true,
              },
            ],
            { session }
          );

        transaction = createdTransactions[0];

        // INCOME
        if (type === "income") {
          sourceAccount.balance += numericAmount;
        }

        // EXPENSE
        if (type === "expense") {
          if (sourceAccount.type === "credit_card") {
            // More money owed on the card.
            sourceAccount.balance += numericAmount;
          } else {
            sourceAccount.balance -= numericAmount;
          }
        }

        // REFUND
        if (type === "refund") {
          if (sourceAccount.type === "credit_card") {
            // Refund reduces card outstanding.
            sourceAccount.balance -= numericAmount;
          } else {
            sourceAccount.balance += numericAmount;
          }
        }

        // INTERNAL TRANSFER
        if (type === "transfer") {
          sourceAccount.balance -= numericAmount;
          destinationAccount.balance += numericAmount;

          await destinationAccount.save({ session });
        }

        // CREDIT CARD PAYMENT
        if (type === "credit_card_payment") {
          sourceAccount.balance -= numericAmount;

          // Paying the bill reduces amount owed.
          destinationAccount.balance -= numericAmount;

          await destinationAccount.save({ session });
        }

        await sourceAccount.save({ session });
      });
    } finally {
      await session.endSession();
    }

    // Only expense transactions participate
    // in anomaly detection.
    if (type === "expense") {
      try {
        await updateAnomalies(req.user._id);

        const updatedTransaction =
          await Transaction.findOne({
            _id: transaction._id,
            user: req.user._id,
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
    }

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    console.error(
      "Add transaction error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to add transaction",
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
        .populate("account", "name type institution last4")
        .populate("transferAccount", "name type institution last4")
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
  const session = await mongoose.startSession();

  try {
    let deletedTransaction = null;

    await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).session(session);

      if (!transaction) {
        throw new Error("TRANSACTION_NOT_FOUND");
      }

      const sourceAccount = await Account.findOne({
        _id: transaction.account,
        user: req.user._id,
      }).session(session);

      let destinationAccount = null;

      if (transaction.transferAccount) {
        destinationAccount = await Account.findOne({
          _id: transaction.transferAccount,
          user: req.user._id,
        }).session(session);
      }

      const amount = Number(transaction.amount);

      if(transaction.balanceApplied){
        // Reverse INCOME
        if (transaction.type === "income" && sourceAccount) {
          sourceAccount.balance -= amount;
        }

        // Reverse EXPENSE
        if (transaction.type === "expense" && sourceAccount) {
          if (sourceAccount.type === "credit_card") {
            sourceAccount.balance -= amount;
          } else {
            sourceAccount.balance += amount;
          }
        }

        // Reverse REFUND
        if (transaction.type === "refund" && sourceAccount) {
          if (sourceAccount.type === "credit_card") {
            sourceAccount.balance += amount;
          } else {
            sourceAccount.balance -= amount;
          }
        }

        // Reverse TRANSFER
        if (
          transaction.type === "transfer" &&
          sourceAccount &&
          destinationAccount
        ) {
          sourceAccount.balance += amount;
          destinationAccount.balance -= amount;

          await destinationAccount.save({ session });
        }

        // Reverse CREDIT CARD PAYMENT
        if (
          transaction.type === "credit_card_payment" &&
          sourceAccount &&
          destinationAccount
        ) {
          sourceAccount.balance += amount;
          destinationAccount.balance += amount;

          await destinationAccount.save({ session });
        }

        if (sourceAccount) {
          await sourceAccount.save({ session });
        }
    }

      deletedTransaction = transaction;

      await Transaction.deleteOne(
        {
          _id: transaction._id,
          user: req.user._id,
        },
        { session }
      );
    });

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
      transaction: deletedTransaction,
    });
  } catch (error) {
    console.error(
      "Delete transaction error:",
      error.message
    );

    if (error.message === "TRANSACTION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  } finally {
    await session.endSession();
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