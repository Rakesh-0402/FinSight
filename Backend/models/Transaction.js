import mongoose from "mongoose";  

const transactionSchema = new mongoose.Schema(
  {
    user : {
      type :mongoose.Schema.Types.ObjectId,
      ref : "User",
      required: true,
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
      enum: ["income", "expense", "transfer"],
      required: true,
    },

    category: {
      type: String,
      default: "Uncategorized",
    },

    source: {
      type: String,
      enum: ["bank_csv", "manual"],
      required: true,
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
    } 
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, date: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;