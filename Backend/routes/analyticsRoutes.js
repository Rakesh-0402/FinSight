import express from "express";
import {getAnalyticsData} from "../controllers/analyticsController.js";
import { protectedRoute } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", protectedRoute, getAnalyticsData);

export default router;