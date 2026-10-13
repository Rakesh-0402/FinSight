import express from "express";
import { protectedRoute } from "../middleware/authmiddleware.js";
import { getFinancialInsights } from "../controllers/insightsController.js";

const router = express.Router();
router.get("/", protectedRoute, getFinancialInsights);
export default router;
