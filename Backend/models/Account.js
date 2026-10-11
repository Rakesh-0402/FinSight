import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["bank", "credit_card", "cash", "wallet"],
      required: true,
    },

    institution: {
      type: String,
      default: null,
      trim: true,
    },

    last4: {
      type: String,
      default: null,
      trim: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    creditLimit: {
      type: Number,
      default: null,
      min: 0,
    },

    statementDueDate: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },

    connectionType: {
      type: String,
      enum: ["manual", "account_aggregator", "bank_api"],
      default: "manual",
    },

    externalAccountId: {
      type: String,
      default: null,
      trim: true,
    },

    provider: {
      type: String,
      default: null,
      trim: true,
    },

    connectionStatus: {
      type: String,
      enum: ["manual", "connected", "disconnected", "error"],
      default: "manual",
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },

    currency: {
      type: String,
      default: "INR",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ user: 1, type: 1 });

accountSchema.index(
  { user: 1, externalAccountId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

const Account = mongoose.model("Account", accountSchema);

export default Account;