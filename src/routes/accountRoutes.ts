import express from "express";
import * as accountController from "../controllers/accountController";

const router = express.Router();

// GET /api/account/balance
router.get("/balance", accountController.getBalance);

// GET /api/account/info
router.get("/info", accountController.getAccountInfo);

// POST /api/account/deposit
router.post("/deposit", accountController.deposit);

// POST /api/account/refund
router.post("/refund", accountController.requestRefund);

export default router;
