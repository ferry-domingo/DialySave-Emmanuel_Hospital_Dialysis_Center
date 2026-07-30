import express from "express";
import { getAdmissionReport, updateInfoRelayed } from "../controllers/admissionReportController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
router.use(protect, roleOnly(ROLES.PHILHEALTH_OFFICER));

router.get("/", getAdmissionReport);
router.put("/:id", updateInfoRelayed);

export default router;
