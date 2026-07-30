import express from "express";
import { getActivityLogs } from "../controllers/activityLogController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.get("/", getActivityLogs);

export default router;
