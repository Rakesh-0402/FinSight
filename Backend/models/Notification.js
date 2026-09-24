import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "anomaly",
        "spending",
        "forecast",
        "upload",
        "system",
      ],
      default: "system",
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    link: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
notificationSchema.index({user : 1 , createdAt: -1});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;