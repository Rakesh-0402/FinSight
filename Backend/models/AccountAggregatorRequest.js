import mongoose from "mongoose";

const accountAggregatorRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    consentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    consentStatus: {
      type: String,
      default: "PENDING",
      trim: true,
    },
    consentUrl: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
      trim: true,
    },
    sessionStatus: {
      type: String,
      default: null,
      trim: true,
    },
    latestNotificationType: {
      type: String,
      default: null,
    },
    lastNotificationAt: {
      type: Date,
      default: null,
    },
    lastNotificationSuccess: {
      type: Boolean,
      default: null,
    },
    lastNotificationErrorCode: {
      type: String,
      default: null,
    },
    lastNotificationErrorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

accountAggregatorRequestSchema.index({ user: 1, consentId: 1 });
accountAggregatorRequestSchema.index(
  { sessionId: 1 },
  { sparse: true }
);

const AccountAggregatorRequest =
  mongoose.models.AccountAggregatorRequest ||
  mongoose.model("AccountAggregatorRequest", accountAggregatorRequestSchema);

export default AccountAggregatorRequest;
