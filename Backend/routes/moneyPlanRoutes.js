import express from "express";
import { protectedRoute } from "../middleware/authmiddleware.js";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getSavingsGoals,
  createSavingsGoal,
  addGoalContribution,
  deleteSavingsGoal,
  getRecurringBills,
  createRecurringBill,
  markRecurringBillPaid,
  updateRecurringBillStatus,
  deleteRecurringBill,
} from "../controllers/moneyPlanController.js";

const router = express.Router();

router.get("/budgets", protectedRoute, getBudgets);
router.post("/budgets", protectedRoute, createBudget);
router.patch("/budgets/:id", protectedRoute, updateBudget);
router.delete("/budgets/:id", protectedRoute, deleteBudget);

router.get("/goals", protectedRoute, getSavingsGoals);
router.post("/goals", protectedRoute, createSavingsGoal);
router.post("/goals/:id/contributions", protectedRoute, addGoalContribution);
router.delete("/goals/:id", protectedRoute, deleteSavingsGoal);

router.get("/bills", protectedRoute, getRecurringBills);
router.post("/bills", protectedRoute, createRecurringBill);
router.post("/bills/:id/mark-paid", protectedRoute, markRecurringBillPaid);
router.patch("/bills/:id/status", protectedRoute, updateRecurringBillStatus);
router.delete("/bills/:id", protectedRoute, deleteRecurringBill);

export default router;
