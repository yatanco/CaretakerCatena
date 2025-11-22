"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceController_1 = require("../controllers/serviceController");
const router = (0, express_1.Router)();
// POST /api/services/run
router.post("/run", serviceController_1.runService);
// GET /api/services/list
router.get("/list", serviceController_1.listServices);
exports.default = router;
