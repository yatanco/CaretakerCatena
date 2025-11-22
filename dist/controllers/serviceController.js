"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = exports.runService = void 0;
const brokerService_1 = require("../services/brokerService");
/**
 * POST /api/services/run
 * Sends a query to an AI model through 0G Compute
 */
const runService = async (req, res) => {
    try {
        const { input } = req.body;
        if (!input || input.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Input is required"
            });
        }
        // Pick a default provider — choose llama-3.3-70b-instruct
        const providerAddress = brokerService_1.OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
        // Call the correct 0G function
        const result = await brokerService_1.brokerService.sendQuery(providerAddress, input);
        return res.status(200).json({
            success: true,
            result
        });
    }
    catch (error) {
        console.error("runService error:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.runService = runService;
/**
 * GET /api/services/list
 */
const listServices = async (req, res) => {
    try {
        const list = await brokerService_1.brokerService.listServices();
        return res.json({
            success: true,
            services: list
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.listServices = listServices;
