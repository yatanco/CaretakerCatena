import express from "express";
import * as accountController from "../controllers/accountController";

const router = express.Router();

// Account info
router.get("/info", accountController.getAccountInfo);

// Deposit funds
router.post("/deposit", accountController.deposit);

// Request refund
router.post("/refund", accountController.requestRefund);

// Get balance
router.get("/balance", accountController.getBalance);

// Acknowledge provider (make sure this exists in the controller)
router.post("/acknowledge", accountController.acknowledgeProvider);

export default router;
