import express from "express";
import { protectedRoute } from "../middleware/authmiddleware.js";

import {
  startBankConnection,
  getConsentStatus,
  createDataSession,
  getDataSession,
  syncAccountAggregatorData,
} from "../controllers/accountAggregatorController.js";
import {
  handleAccountAggregatorNotification,
} from "../controllers/accountAggregatorWebhookController.js";

const router = express.Router();

// Setu calls this endpoint server-to-server, so it must be registered BEFORE
// protectedRoute. It validates the notification shape and only updates status
// metadata; it does not sync bank transactions automatically.
router.post("/notifications", handleAccountAggregatorNotification);

// All user-facing AA endpoints remain authenticated.
router.use(protectedRoute);

router.get("/consent/:id", getConsentStatus);
router.post("/connect", startBankConnection);
router.post("/session", createDataSession);
router.get("/session/:id", getDataSession);
router.post("/sync", syncAccountAggregatorData);

export default router;
