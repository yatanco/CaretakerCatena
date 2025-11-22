import { Request, Response } from "express";
import { brokerService } from "../services/brokerService";

/**
 * Recursively converts BigInt values to strings.
 */
const convertBigIntToString = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data === "bigint") return data.toString();

  if (Array.isArray(data)) {
    return data.map(convertBigIntToString);
  }

  if (typeof data === "object") {
    const result: any = {};
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
export const getBalance = async (req: Request, res: Response) => {
  try {
    const balance = await brokerService.getBalance();
    res.status(200).json({
      success: true,
      balance: convertBigIntToString(balance)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /account/deposit
 */
export const deposit = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount required"
      });
    }

    const result = await brokerService.depositFunds(Number(amount));

    return res.status(200).json({
      success: true,
      message: result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /account/info
 */
export const getAccountInfo = async (req: Request, res: Response) => {
  try {
    const info = await brokerService.getBalance();
    res.status(200).json({
      success: true,
      accountInfo: convertBigIntToString(info)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /account/refund
 */
export const requestRefund = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount required"
      });
    }

    const result = await brokerService.requestRefund(Number(amount));

    return res.status(200).json({
      success: true,
      message: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
