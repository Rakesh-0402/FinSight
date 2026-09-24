import express from "express";

import {askFinancialAssistant,getChat, getChats, deleteChat, deleteAllChats} from "../controllers/chatController.js";
import {protectedRoute,} from "../middleware/authmiddleware.js"
import { chatLimiter } from "../middleware/rateLimiters.js";
const router = express.Router();

router.post("/", chatLimiter, protectedRoute,askFinancialAssistant);
router.get("/:id", protectedRoute,getChat);
router.get("/" ,protectedRoute, getChats);
router.delete("/:id" ,protectedRoute, deleteChat);
router.delete(
  "/",
  protectedRoute,
  deleteAllChats
);
export default router;