import { Request, Response } from "express";
import { brokerService, OFFICIAL_PROVIDERS } from "../services/brokerService";

/**
 * POST /api/services/run
 * Sends a query to an AI model through 0G Compute
 */
export const runService = async (req: Request, res: Response) => {
  try {
    const { input } = req.body;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Input is required"
      });
    }

    // Pick a default provider — choose llama-3.3-70b-instruct
    const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];

    // Call the correct 0G function
    const result = await brokerService.sendQuery(providerAddress, input);

    return res.status(200).json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error("runService error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


/**
 * GET /api/services/list
 */
export const listServices = async (req: Request, res: Response) => {
  try {
    const list = await brokerService.listServices();
    return res.json({
      success: true,
      services: list
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
