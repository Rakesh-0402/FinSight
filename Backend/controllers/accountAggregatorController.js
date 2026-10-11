import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

export const startBankConnection = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Step 1: get Setu access token
    const tokenResponse = await fetch(
      "https://accountservice.setu.co/v1/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          client: "bridge",
        },
        body: JSON.stringify({
          clientID: process.env.SETU_CLIENT_ID,
          secret: process.env.SETU_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Setu token error:", tokenData);

      return res.status(502).json({
        success: false,
        message: "Failed to authenticate with Setu",
      });
    }

    const accessToken =
      tokenData.access_token ||
      tokenData.accessToken;

    if (!accessToken) {
      return res.status(502).json({
        success: false,
        message: "Setu did not return an access token",
      });
    }

    // Step 2: create consent request

    const consentResponse = await fetch(
      `${process.env.SETU_AA_BASE_URL}/v2/consents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-product-instance-id":
            process.env.SETU_PRODUCT_INSTANCE_ID,
        },
        body: JSON.stringify({
          consentDuration: {
            unit: "MONTH",
            value: "12",
          },

          vua: mobile,

          dataRange: {
            from: "2021-01-01T00:00:00.000Z",
            to: "2021-06-30T23:59:59.999Z",
          },

          context: [],
        }),
      }
    );

    const consentData = await consentResponse.json();

    if (!consentResponse.ok) {
      console.error(
        "Setu consent error:",
        consentData
      );

      return res.status(502).json({
        success: false,
        message: "Failed to create consent request",
        error: consentData,
      });
    }

    return res.status(200).json({
      success: true,
      consentId: consentData.id,
      status: consentData.status,
      url: consentData.url,
    });
  } catch (error) {
    console.error(
      "AA connection error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to start bank connection",
    });
  }
};

//consent creation status endpoint
export const getConsentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const tokenResponse = await fetch(
      "https://accountservice.setu.co/v1/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          client: "bridge",
        },
        body: JSON.stringify({
          clientID: process.env.SETU_CLIENT_ID,
          secret: process.env.SETU_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to authenticate with Setu",
      });
    }

    const accessToken =
      tokenData.access_token || tokenData.accessToken;

    const response = await fetch(
      `${process.env.SETU_AA_BASE_URL}/v2/consents/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-product-instance-id":
            process.env.SETU_PRODUCT_INSTANCE_ID,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch consent status",
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      consent: data,
    });
  } catch (error) {
    console.error("Consent status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch consent status",
    });
  }
};

//create the data session 
export const createDataSession = async (req, res) => {
  try {
    const { consentId } = req.body;

    if (!consentId) {
      return res.status(400).json({
        success: false,
        message: "Consent ID is required",
      });
    }

    // Get Setu access token
    const tokenResponse = await fetch(
      "https://accountservice.setu.co/v1/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          client: "bridge",
        },
        body: JSON.stringify({
          clientID: process.env.SETU_CLIENT_ID,
          secret: process.env.SETU_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to authenticate with Setu",
      });
    }

    const accessToken =
      tokenData.access_token || tokenData.accessToken;

    const response = await fetch(
      `${process.env.SETU_AA_BASE_URL}/v2/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-product-instance-id":
            process.env.SETU_PRODUCT_INSTANCE_ID,
        },
        body: JSON.stringify({
          consentId,
          dataRange: {
            from: "2021-01-01T00:00:00.000Z",
            to: "2021-06-30T23:59:59.999Z",
          },
          format: "json",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Setu session error:", data);

      return res.status(502).json({
        success: false,
        message: "Failed to create data session",
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      session: data,
    });
  } catch (error) {
    console.error("Create data session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create data session",
    });
  }
};

//fetch the data session by its session Id
export const getDataSession = async (req, res) => {
  try {
    const { id } = req.params;

    const tokenResponse = await fetch(
      "https://accountservice.setu.co/v1/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          client: "bridge",
        },
        body: JSON.stringify({
          clientID: process.env.SETU_CLIENT_ID,
          secret: process.env.SETU_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to authenticate with Setu",
      });
    }

    const accessToken =
      tokenData.access_token || tokenData.accessToken;

    const response = await fetch(
      `${process.env.SETU_AA_BASE_URL}/v2/sessions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-product-instance-id":
            process.env.SETU_PRODUCT_INSTANCE_ID,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch data session",
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      session: data,
    });
  } catch (error) {
    console.error("Get data session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch data session",
    });
  }
};

const detectTransactionType = (bankTxn) => {
  const narration = (bankTxn.narration || "").toLowerCase();
  const bankType = bankTxn.type?.toUpperCase();

  // Credit card bill/payment
  if (
    narration.includes("credit card payment") ||
    narration.includes("card payment") ||
    narration.includes("cc payment")
  ) {
    return "credit_card_payment";
  }

  // Refund/reversal
  if (
    narration.includes("refund") ||
    narration.includes("reversal") ||
    narration.includes("reversed")
  ) {
    return "refund";
  }

  // Don't classify generic UPI/NEFT/IMPS as transfer.
  // Those can be real expenses.
  if (
    narration.includes("self transfer") ||
    narration.includes("transfer to self") ||
    narration.includes("own account")
  ) {
    return "transfer";
  }

  if (bankType === "CREDIT") {
    return "income";
  }

  return "expense";
};
//show the response
export const syncAccountAggregatorData = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const tokenResponse = await fetch(
      "https://accountservice.setu.co/v1/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          client: "bridge",
        },
        body: JSON.stringify({
          clientID: process.env.SETU_CLIENT_ID,
          secret: process.env.SETU_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to authenticate with Setu",
      });
    }

    const accessToken =
      tokenData.access_token || tokenData.accessToken;

    const response = await fetch(
      `${process.env.SETU_AA_BASE_URL}/v2/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-product-instance-id":
            process.env.SETU_PRODUCT_INSTANCE_ID,
        },
      }
    );

    const sessionData = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch Setu session",
        error: sessionData,
      });
    }

    if (
      !["PARTIAL", "COMPLETED"].includes(sessionData.status)
    ) {
      return res.status(409).json({
        success: false,
        message: `Session is ${sessionData.status}. Data is not ready yet.`,
      });
    }

    let accountsSynced = 0;
    let transactionsAdded = 0;

    for (const fip of sessionData.fips || []) {
      for (const linkedAccount of fip.accounts || []) {
        if (linkedAccount.FIstatus !== "READY") {
          continue;
        }

        const bankData = linkedAccount.data?.account;

        if (!bankData) {
          continue;
        }

        const summary = bankData.summary || {};

        const last4 =
          bankData.maskedAccNumber?.slice(-4) || null;

        const account = await Account.findOneAndUpdate(
          {
            user: req.user._id,
            externalAccountId: bankData.linkedAccRef,
          },
          {
            $set: {
              name: `${
                summary.type || "Bank"
              } •••• ${last4 || ""}`.trim(),

              type: "bank",

              institution: fip.fipID,

              last4,

              balance: Number(
                summary.currentBalance || 0
              ),

              connectionType:
                "account_aggregator",

              externalAccountId:
                bankData.linkedAccRef,

              provider: fip.fipID,

              connectionStatus: "connected",

              lastSyncedAt: new Date(),

              currency:
                summary.currency || "INR",

              isActive: true,
            },

            $setOnInsert: {
              user: req.user._id,
            },
          },
          {
            new: true,
            upsert: true,
          }
        );

        accountsSynced++;

        const bankTransactions =
          bankData.transactions?.transaction || [];

        for (const bankTxn of bankTransactions) {
          const externalTransactionId =
            bankTxn.txnId ||
            bankTxn.reference;

          if (!externalTransactionId) {
            continue;
          }

          const exists = await Transaction.exists({
            user: req.user._id,
            account: account._id,
            externalTransactionId,
          });

          if (exists) {
            continue;
          }

          const bankType =
            bankTxn.type?.toUpperCase();

          const type = detectTransactionType(bankTxn);

          let category ="Uncategorized";

          let confidence = null;
          if (type === "income") {
            category = "Income";
          }

          if (type === "transfer") {
            category = "Transfer";
          }

          if (type === "credit_card_payment") {
            category = "Credit Card Payment";
          }

          if (type === "refund") {
            category = "Refund";
          }

          if (type === "expense") {
            try {
              const aiResponse = await fetch(
                `${process.env.AI_SERVICE_URL}/categorize`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    description:
                      bankTxn.narration ||
                      "Bank transaction",
                  }),
                }
              );

              if (aiResponse.ok) {
                const aiData =
                  await aiResponse.json();

                category =
                  aiData.category ||
                  "Uncategorized";

                confidence =
                  aiData.confidence ?? null;
              }
            } catch (error) {
              console.error(
                "AA categorization failed:",
                error.message
              );
            }
          }

          await Transaction.create({
            user: req.user._id,
            account: account._id,

            date:
              bankTxn.transactionTimestamp,

            description:
              bankTxn.narration ||
              "Bank transaction",

            amount: Number(
              bankTxn.amount || 0
            ),

            type,

            category,
            confidence,
            source: "account_aggregator",

            externalTransactionId,

            balanceApplied: false,

            isAnomaly: false,
            anomalyScore: 0,
          });

          transactionsAdded++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Account Aggregator data synced successfully",
      accountsSynced,
      transactionsAdded,
    });
  } catch (error) {
    console.error(
      "AA sync error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to sync Account Aggregator data",
    });
  }
};