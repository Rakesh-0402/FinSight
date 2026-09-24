import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "New Chat",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },

        text: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

chatSchema.index({user : 1, updatedAt : -1})
export default mongoose.model("Chat", chatSchema);