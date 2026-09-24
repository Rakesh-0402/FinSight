import mongoose from "mongoose";

const uploadHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    contentHash: {
      type: String,
      required: true,
      index: true,
    },

    transactionCount: {
      type: Number,
      required: true,
    },

    periodStart: {
      type: Date,
      default: null,
    },

    periodEnd: {
      type: Date,
      default: null,
    },

    originalFileName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

uploadHistorySchema.index(
  {
    user: 1,
    contentHash: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "UploadHistory",
  uploadHistorySchema
);