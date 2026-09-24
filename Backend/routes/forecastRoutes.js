import express from "express";
import {getForecast,} from "../controllers/forecastController.js";
import {protectedRoute,} from "../middleware/authmiddleware.js"
import {
  confirmZeroExpenseMonth,
  removeZeroExpenseMonth,
} from "../controllers/expenseMonthConfirmationController.js";
const router = express.Router();

router.get("/", protectedRoute, getForecast);
router.post("/zero-months", protectedRoute, confirmZeroExpenseMonth);

router.delete(
  "/zero-months/:year/:month",
  protectedRoute,
  removeZeroExpenseMonth
);

export default router;