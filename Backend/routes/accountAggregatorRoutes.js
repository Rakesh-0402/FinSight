import express from "express";
import { protectedRoute } from "../middleware/authmiddleware.js";

import {
  startBankConnection,
  getConsentStatus,
  createDataSession,
  getDataSession,
  syncAccountAggregatorData,
} from "../controllers/accountAggregatorController.js";

const router = express.Router();

router.use(protectedRoute);

router.get("/consent/:id" , getConsentStatus);

router.post("/connect", startBankConnection);
router.post("/session", createDataSession);
router.get("/session/:id", getDataSession);
router.post("/sync",syncAccountAggregatorData);

export default router;