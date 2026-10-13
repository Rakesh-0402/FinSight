import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

// --------------------------------------------------
// Proxy configuration and shared helpers
// --------------------------------------------------

const getProxyBaseUrl = () => {
  const url = process.env.AA_PROXY_URL?.trim().replace(/\/+$/, "");

  if (!url) {
    throw new Error("AA_PROXY_URL is not configured");
  }

  if (!process.env.AA_PROXY_SECRET) {
    throw new Error("AA_PROXY_SECRET is not configured");
  }

  return url;
};

const getSetuHeaders = (accessToken, includeJson = false) => {
  if (!process.env.SETU_PRODUCT_INSTANCE_ID) {
    throw new Error("SETU_PRODUCT_INSTANCE_ID is not configured");
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID,
    "x-aa-proxy-secret": process.env.AA_PROXY_SECRET,
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

// Read the response as text first so HTML errors do not crash JSON parsing.
const readJsonResponse = async (response) => {
  const raw = await response.text();

  try {
    return {
      data: JSON.parse(raw),
      raw,
    };
  } catch {
    return {
      data: null,
      raw,
    };
  }
};

// All authentication requests go through the local proxy.
// The proxy is expected to use its locally configured Setu credentials.
const getSetuAccessToken = async () => {
  const response = await fetch(`${getProxyBaseUrl()}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      client: "bridge",
      "x-aa-proxy-secret": process.env.AA_PROXY_SECRET,
    },
  });

  const { data, raw } = await readJsonResponse(response);

  if (!data) {
    console.error(
      "Setu login proxy returned non-JSON:",
      response.status,
      raw.slice(0, 300)
    );

    throw new Error(
      `Login proxy returned a non-JSON response (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
    console.error("Setu login proxy failed:", response.status, data);

    throw new Error(
      `Setu login failed through proxy (HTTP ${response.status})`
    );
  }

  const accessToken = data.access_token || data.accessToken;

  if (!accessToken) {
    console.error("Login response did not contain an access token:", data);
    throw new Error("Setu login response did not include an access token");
  }

  return accessToken;
};

const readProxyApiResponse = async (response, operation) => {
  const { data, raw } = await readJsonResponse(response);

  if (!data) {
    console.error(
      `${operation} returned non-JSON:`,
      response.status,
      raw.slice(0, 300)
    );

    return {
      ok: false,
      invalidJson: true,
      data: null,
      status: response.status,
    };
  }

  if (!response.ok) {
    console.error(`${operation} failed:`, response.status, data);

    return {
      ok: false,
      invalidJson: false,
      data,
      status: response.status,
    };
  }

  return {
    ok: true,
    invalidJson: false,
    data,
    status: response.status,
  };
};

// Rolling six-month data range ending now.
const getDataRange = () => {
  const to = new Date();
  const from = new Date(to);

  from.setMonth(from.getMonth() - 6);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

// --------------------------------------------------
// 1. Start bank connection / create consent
// --------------------------------------------------

export const startBankConnection = async (req, res) => {
  try {
    const { mobile } = req.body || {};

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Step 1: Authenticate through Cloudflare Tunnel -> local proxy.
    const accessToken = await getSetuAccessToken();

    // Step 2: Create consent through the same proxy.
    const response = await fetch(
      `${getProxyBaseUrl()}/aa/v2/consents`,
      {
        method: "POST",
        headers: getSetuHeaders(accessToken, true),
        body: JSON.stringify({
          consentDuration: {
            unit: "MONTH",
            value: "12",
          },
          vua: mobile,
          dataRange: getDataRange(),
          context: [],
        }),
      }
    );

    const result = await readProxyApiResponse(
      response,
      "Setu consent creation"
    );

    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.invalidJson
          ? "Setu returned an invalid consent response"
          : "Failed to create consent request",
        upstreamStatus: result.status,
        ...(result.data ? { error: result.data } : {}),
      });
    }

    const consent = result.data;

    return res.status(200).json({
      success: true,
      consentId: consent.id,
      status: consent.status,
      url: consent.url,
      consent,
    });
  } catch (error) {
    console.error("Start bank connection error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Failed to start bank connection",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 2. Get consent status
// --------------------------------------------------

export const getConsentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Consent ID is required",
      });
    }

    const accessToken = await getSetuAccessToken();

    // Correctly GET the consent, not the session.
    const response = await fetch(
      `${getProxyBaseUrl()}/aa/v2/consents/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: getSetuHeaders(accessToken),
      }
    );

    const result = await readProxyApiResponse(
      response,
      "Setu consent status"
    );

    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.invalidJson
          ? "Setu returned an invalid consent status response"
          : "Failed to fetch consent status",
        upstreamStatus: result.status,
        ...(result.data ? { error: result.data } : {}),
      });
    }

    return res.status(200).json({
      success: true,
      consent: result.data,
    });
  } catch (error) {
    console.error("Consent status error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Failed to fetch consent status",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 3. Create data session
// --------------------------------------------------

export const createDataSession = async (req, res) => {
  try {
    const { consentId } = req.body || {};

    if (!consentId) {
      return res.status(400).json({
        success: false,
        message: "Consent ID is required",
      });
    }

    const accessToken = await getSetuAccessToken();

    const response = await fetch(
      `${getProxyBaseUrl()}/aa/v2/sessions`,
      {
        method: "POST",
        headers: getSetuHeaders(accessToken, true),
        body: JSON.stringify({
          consentId,
          dataRange: getDataRange(),
          format: "json",
        }),
      }
    );

    const result = await readProxyApiResponse(
      response,
      "Setu data session creation"
    );

    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.invalidJson
          ? "Setu returned an invalid data session response"
          : "Failed to create data session",
        upstreamStatus: result.status,
        ...(result.data ? { error: result.data } : {}),
      });
    }

    return res.status(200).json({
      success: true,
      session: result.data,
    });
  } catch (error) {
    console.error("Create data session error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Failed to create data session",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 4. Get data session
// --------------------------------------------------

export const getDataSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const accessToken = await getSetuAccessToken();

    const response = await fetch(
      `${getProxyBaseUrl()}/aa/v2/sessions/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: getSetuHeaders(accessToken),
      }
    );

    const result = await readProxyApiResponse(
      response,
      "Setu data session fetch"
    );

    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.invalidJson
          ? "Setu returned an invalid data session response"
          : "Failed to fetch data session",
        upstreamStatus: result.status,
        ...(result.data ? { error: result.data } : {}),
      });
    }

    return res.status(200).json({
      success: true,
      session: result.data,
    });
  } catch (error) {
    console.error("Get data session error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Failed to fetch data session",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// Transaction classification helper
// --------------------------------------------------

const detectTransactionType = (bankTxn) => {
  const narration = (bankTxn.narration || "").toLowerCase();
  const bankType = bankTxn.type?.toUpperCase();

  if (
    narration.includes("credit card payment") ||
    narration.includes("card payment") ||
    narration.includes("cc payment")
  ) {
    return "credit_card_payment";
  }

  if (
    narration.includes("refund") ||
    narration.includes("reversal") ||
    narration.includes("reversed")
  ) {
    return "refund";
  }

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

// --------------------------------------------------
// 5. Fetch session data and sync accounts/transactions
// --------------------------------------------------

export const syncAccountAggregatorData = async (req, res) => {
  try {
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    // Fetch the session through the local proxy.
    const accessToken = await getSetuAccessToken();

    const response = await fetch(
      `${getProxyBaseUrl()}/aa/v2/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: getSetuHeaders(accessToken),
      }
    );

    const result = await readProxyApiResponse(
      response,
      "Setu session sync"
    );

    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.invalidJson
          ? "Setu returned an invalid session response"
          : "Failed to fetch Setu session",
        upstreamStatus: result.status,
        ...(result.data ? { error: result.data } : {}),
      });
    }

    const sessionData = result.data;

    if (
      !["READY", "PARTIAL", "COMPLETED"].includes(
        sessionData.status
      )
    ) {
      return res.status(409).json({
        success: false,
        message: `Session is ${
          sessionData.status || "not ready"
        }. Data is not ready yet.`,
        status: sessionData.status,
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
        const last4 = bankData.maskedAccNumber?.slice(-4) || null;
        const externalAccountId = bankData.linkedAccRef;

        if (!externalAccountId) {
          console.warn("Skipping AA account without linkedAccRef");
          continue;
        }

        const account = await Account.findOneAndUpdate(
          {
            user: req.user._id,
            externalAccountId,
          },
          {
            $set: {
              name: `${summary.type || "Bank"} •••• ${last4 || ""}`.trim(),
              type: "bank",
              institution: fip.fipID,
              last4,
              balance: Number(summary.currentBalance || 0),
              connectionType: "account_aggregator",
              externalAccountId,
              provider: fip.fipID,
              connectionStatus: "connected",
              lastSyncedAt: new Date(),
              currency: summary.currency || "INR",
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
            bankTxn.txnId || bankTxn.reference;

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

          const type = detectTransactionType(bankTxn);

          let category = "Uncategorized";
          let confidence = null;

          if (type === "income") {
            category = "Income";
          } else if (type === "transfer") {
            category = "Transfer";
          } else if (type === "credit_card_payment") {
            category = "Credit Card Payment";
          } else if (type === "refund") {
            category = "Refund";
          }

          // AI categorization is independent of the Setu proxy.
          if (
            type === "expense" &&
            process.env.AI_SERVICE_URL
          ) {
            try {
              const aiBaseUrl =
                process.env.AI_SERVICE_URL.replace(/\/+$/, "");

              const aiResponse = await fetch(
                `${aiBaseUrl}/categorize`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    description:
                      bankTxn.narration || "Bank transaction",
                  }),
                }
              );

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();

                category = aiData.category || "Uncategorized";
                confidence = aiData.confidence ?? null;
              } else {
                console.warn(
                  "AI categorization returned HTTP",
                  aiResponse.status
                );
              }
            } catch (error) {
              console.error(
                "AI categorization failed:",
                error.message
              );
            }
          }

          await Transaction.create({
            user: req.user._id,
            account: account._id,
            date: bankTxn.transactionTimestamp
              ? new Date(bankTxn.transactionTimestamp)
              : new Date(),
            description:
              bankTxn.narration || "Bank transaction",
            amount: Number(bankTxn.amount || 0),
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
      message: "Account Aggregator data synced successfully",
      accountsSynced,
      transactionsAdded,
    });
  } catch (error) {
    console.error("AA sync error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Failed to sync Account Aggregator data",
      error: error.message,
    });
  }
};