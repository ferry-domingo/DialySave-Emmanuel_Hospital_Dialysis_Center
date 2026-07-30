import express from "express";
import { getPatientMonitoring } from "../controllers/monitoringController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();

router.get("/:id", protect, roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), getPatientMonitoring);

export default router;
