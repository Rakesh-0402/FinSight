import mongoose from "mongoose";  

const transactionSchema = new mongoose.Schema(
  {
    user : {
      type :mongoose.Schema.Types.ObjectId,
      ref : "User",
      required: true,
    },

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      default: "Unknown transaction"
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["income", "expense", "transfer", "credit_card_payment", "refund"],
      required: true,
    },

    category: {
      type: String,
      default: "Uncategorized",
    },

    source: {
      type: String,
      enum: ["bank_csv", "credit_card_csv" ,"manual", "account_aggregator"],
      required: true,
    },

    transferAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    merchant: {
      type: String,
      default: null,
      trim: true,
    },

    confidence: {
      type: Number,
      default: null,
    },

    isAnomaly: {
      type: Boolean,
      default: false,
    },

    anomalyScore: {
      type: Number,
      default: 0,
    },

    uploadId : {
      type :mongoose.Schema.Types.ObjectId,
      ref : "UploadHistory",
      default : null,
    },
    
    balanceApplied: {
      type: Boolean,
      default: false,
    },

    externalTransactionId: {
      type: String,
      default: null,
      trim: true,
    },

  },
  {
    timestamps: true,
  }
);
transactionSchema.index(
  { user: 1, account: 1, externalTransactionId : 1,  date: -1 },
  { unique : true, sparse : true,}
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;