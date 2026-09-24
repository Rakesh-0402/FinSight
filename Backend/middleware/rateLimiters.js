//mainly for security
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many attempts. Please try again later.",
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many uploads. Please try again later.",
  },
});

export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 60,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please wait a moment.",
  },
});