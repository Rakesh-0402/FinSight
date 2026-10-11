import express from "express";

import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} from "../controllers/accountController.js";

import { protectedRoute } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protectedRoute);

router.get("/", getAccounts);
router.post("/", createAccount);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);

export default router;