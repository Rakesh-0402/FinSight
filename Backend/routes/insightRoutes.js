import express from "express";

import {getFinancialContext,} from "../controllers/insightController.js";
import {protectedRoute,} from "../middleware/authmiddleware.js"

const router = express.Router();

router.get("/context", protectedRoute, getFinancialContext);

export default router;