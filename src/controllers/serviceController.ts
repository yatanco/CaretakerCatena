import { Request, Response } from "express";
import { brokerService, OFFICIAL_PROVIDERS } from "../services/brokerService";

/**
 * POST /api/services/run
 * Sends a query to an AI model through 0G Compute
 */
export const runService = async (req: Request, res: Response) => {
  const { input } = req.body;

  if (!input || input.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Input is required"
    });
  }

  try {
    // ---------------------------
    // Primary path: real 0G call
    // ---------------------------
    const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
    const result = await brokerService.sendQuery(providerAddress, input);

    return res.status(200).json({
      success: true,
      reply: result.output || result || "No output returned"
    });

  } catch (error: any) {
    // -----------------------------------------
    // Fallback path: graceful AI helper response
    // -----------------------------------------
    console.error("runService error:", error);

    const friendlyReply = `
I'm having trouble connecting to the 0G compute network right now, so I'm answering directly.

You asked: "${input}"

Here's something that often helps caregivers in this situation:

• People with Alzheimer's or memory loss repeat questions because the mind can’t hold the answer.  
• Arguing or reminding them they “already asked” usually increases anxiety.  
• Instead, give the same calm, reassuring answer each time.  
• Then gently redirect to something comforting: a photo, music, a snack, or a familiar activity.  
• Your goal is not to fix the memory — it's to help them feel safe and grounded.

If you’d like to ask more or talk through a specific pattern, I’m here for you.
`.trim();

    return res.status(200).json({
      success: true,
      reply: friendlyReply,
      fallback: true,
      error: error?.message
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
