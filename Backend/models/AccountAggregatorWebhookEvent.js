import mongoose from "mongoose";

const accountAggregatorWebhookEventSchema = new mongoose.Schema(
  {
    // Setu may omit notificationId for some successful notifications.
    // In that case the controller uses a SHA-256 hash of the payload.
    eventKey: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["CONSENT_STATUS_UPDATE", "SESSION_STATUS_UPDATE"],
      required: true,
    },
    consentId: {
      type: String,
      default: null,
      index: true,
    },
    dataSessionId: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      default: null,
    },
    success: {
      type: Boolean,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    eventTimestamp: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AccountAggregatorWebhookEvent =
  mongoose.models.AccountAggregatorWebhookEvent ||
  mongoose.model(
    "AccountAggregatorWebhookEvent",
    accountAggregatorWebhookEventSchema
  );

export default AccountAggregatorWebhookEvent;
