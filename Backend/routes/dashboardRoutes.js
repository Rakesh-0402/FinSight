import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import {protectedRoute,} from "../middleware/authmiddleware.js"

const router = express.Router();

router.get("/", protectedRoute, getDashboardData);

export default router;