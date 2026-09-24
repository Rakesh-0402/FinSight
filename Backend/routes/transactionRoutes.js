import express from "express";
import { createTransaction , getTransactions, runAnomalyDetection, deleteTransaction, deleteAllTransactions, getAnomalies} from "../controllers/transactionController.js";
import {protectedRoute,} from "../middleware/authmiddleware.js"
const router = express.Router();

router.post("/", protectedRoute, createTransaction);
router.get("/", protectedRoute, getTransactions);
router.post("/detect-anomalies",protectedRoute, runAnomalyDetection);
router.delete(
  "/:id",
  protectedRoute,
  deleteTransaction
);
router.delete(
  "/",
  protectedRoute,
  deleteAllTransactions
);
router.get(
  "/anomalies",
  protectedRoute,
  getAnomalies
);
export default router;