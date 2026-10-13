import { createHash } from "node:crypto";
import AccountAggregatorRequest from "../models/AccountAggregatorRequest.js";
import AccountAggregatorWebhookEvent from "../models/AccountAggregatorWebhookEvent.js";

const supportedTypes = new Set([
  "CONSENT_STATUS_UPDATE",
  "SESSION_STATUS_UPDATE",
]);

const asStringOrNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Public Setu AA webhook.
 *
 * Setu's AA notification payloads use:
 * - type: CONSENT_STATUS_UPDATE or SESSION_STATUS_UPDATE
 * - consentId for consent notifications
 * - dataSessionId for FI/session notifications
 * - data.status for the current status
 *
 * This endpoint only records status metadata. It does not import financial
 * data or initiate any bank operation from an incoming webhook.
 */
export const handleAccountAggregatorNotification = async (req, res) => {
  try {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "A JSON notification body is required",
      });
    }

    const type = asStringOrNull(body.type);
    if (!supportedTypes.has(type)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported Account Aggregator notification type",
      });
    }

    const consentId = asStringOrNull(body.consentId);
    const dataSessionId = asStringOrNull(body.dataSessionId);
    const status = asStringOrNull(body.data?.status);
    const errorCode = asStringOrNull(body.error?.code);
    const errorMessage = asStringOrNull(body.error?.message);
    const eventTimestamp = parseDateOrNull(body.timestamp);

    if (!consentId) {
      return res.status(400).json({
        success: false,
        message: "Notification is missing consentId",
      });
    }

    if (type === "SESSION_STATUS_UPDATE" && !dataSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session notification is missing dataSessionId",
      });
    }

    if (body.success !== false && !status) {
      return res.status(400).json({
        success: false,
        message: "Notification is missing data.status",
      });
    }

    // Setu can omit notificationId, so derive a stable key for deduplication.
    const eventKey =
      asStringOrNull(body.notificationId) ||
      createHash("sha256").update(JSON.stringify(body)).digest("hex");

    await AccountAggregatorWebhookEvent.updateOne(
      { eventKey },
      {
        $setOnInsert: {
          eventKey,
          type,
          consentId,
          dataSessionId,
          status,
          success: typeof body.success === "boolean" ? body.success : null,
          errorCode,
          errorMessage,
          eventTimestamp,
          receivedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const statusUpdate = {
      latestNotificationType: type,
      lastNotificationAt: eventTimestamp || new Date(),
      lastNotificationSuccess:
        typeof body.success === "boolean" ? body.success : null,
      lastNotificationErrorCode: errorCode,
      lastNotificationErrorMessage: errorMessage,
    };

    if (type === "CONSENT_STATUS_UPDATE") {
      if (status) statusUpdate.consentStatus = status;

      await AccountAggregatorRequest.updateOne(
        { consentId },
        { $set: statusUpdate }
      );
    } else {
      if (status) statusUpdate.sessionStatus = status;

      await AccountAggregatorRequest.updateOne(
        { consentId, sessionId: dataSessionId },
        { $set: statusUpdate }
      );
    }

    // Acknowledge valid notifications even if they arrive before the
    // corresponding request record has been persisted. The event log retains
    // the notification for diagnostics.
    return res.status(200).json({
      success: true,
      received: true,
      duplicateSafe: true,
    });
  } catch (error) {
    console.error(
      "Account Aggregator webhook error:",
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to process Account Aggregator notification",
    });
  }
};
