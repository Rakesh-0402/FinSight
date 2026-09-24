import express from "express";

import {signup, login, getProfile, updateProfile, changePassword, deleteAccount} from "../controllers/authController.js";

import {protectedRoute} from "../middleware/authmiddleware.js"
import {
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import { authLimiter } from "../middleware/rateLimiters.js";
const router = express.Router();

//these dont have protected routes they are the public routes
router.post("/forgot-password",authLimiter, forgotPassword);

router.post("/reset-password/:token",authLimiter, resetPassword);

router.post("/signup",authLimiter, signup);

router.post("/login", authLimiter, login);

router.get("/me", protectedRoute, getProfile);

router.put("/profile", protectedRoute, updateProfile);

router.put("/password",protectedRoute, changePassword);
router.delete(
  "/account",
  protectedRoute,
  deleteAccount
);

export default router;