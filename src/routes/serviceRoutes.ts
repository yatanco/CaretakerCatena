import { Router } from "express";
import { runService, listServices } from "../controllers/serviceController";

const router = Router();

// POST /api/services/run
router.post("/run", runService);

// GET /api/services/list
router.get("/list", listServices);

export default router;
