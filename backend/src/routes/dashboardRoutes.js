import express from "express";
import { getAdminDashboardSummary, getCashierDashboardSummary, getDashboardSummary } from "../controllers/dashboardController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();

router.get("/summary", protect, roleOnly(ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), getDashboardSummary);
router.get("/admin-summary", protect, roleOnly(ROLES.ADMIN), getAdminDashboardSummary);
router.get("/cashier-summary", protect, roleOnly(ROLES.CASHIER), getCashierDashboardSummary);

export default router;
