"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRefund = exports.getAccountInfo = exports.deposit = exports.getBalance = void 0;
const brokerService_1 = require("../services/brokerService");
/**
 * Recursively converts BigInt values to strings.
 */
const convertBigIntToString = (data) => {
    if (data === null || data === undefined)
        return data;
    if (typeof data === "bigint")
        return data.toString();
    if (Array.isArray(data)) {
        return data.map(convertBigIntToString);
    }
    if (typeof data === "object") {
        const result = {};
        for (const key in data) {
            result[key] = convertBigIntToString(data[key]);
        }
        return result;
    }
    return data;
};
/**
 * GET /account/balance
 */
const getBalance = async (req, res) => {
    try {
        const balance = await brokerService_1.brokerService.getBalance();
        res.status(200).json({
            success: true,
            balance: convertBigIntToString(balance)
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getBalance = getBalance;
/**
 * POST /account/deposit
 */
const deposit = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Valid amount required"
            });
        }
        const result = await brokerService_1.brokerService.depositFunds(Number(amount));
        return res.status(200).json({
            success: true,
            message: result
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.deposit = deposit;
/**
 * GET /account/info
 */
const getAccountInfo = async (req, res) => {
    try {
        const info = await brokerService_1.brokerService.getBalance();
        res.status(200).json({
            success: true,
            accountInfo: convertBigIntToString(info)
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getAccountInfo = getAccountInfo;
/**
 * POST /account/refund
 */
const requestRefund = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Valid amount required"
            });
        }
        const result = await brokerService_1.brokerService.requestRefund(Number(amount));
        return res.status(200).json({
            success: true,
            message: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.requestRefund = requestRefund;
