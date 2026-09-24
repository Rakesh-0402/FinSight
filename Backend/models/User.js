import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    
    settings: {
      currency: {
        type: String,
        default: "INR",
      },

      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
    },
    passwordResetToken: {
      type: String,
      default : null,
      select : false,
    },

    passwordResetExpires: {
      type: Date,
      default : null,
      select : false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);