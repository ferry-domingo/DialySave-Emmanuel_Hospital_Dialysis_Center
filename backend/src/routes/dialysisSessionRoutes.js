import express from "express";
import {
  createDialysisSession,
  getDialysisSessions,
  getDialysisSessionById,
  updateDialysisSession,
  deleteDialysisSession,
  acknowledgeAgreement,
  signAgreement,
  updateAgreementHeparin,
  updateCashReason,
} from "../controllers/dialysisSessionController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
router.use(protect, roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER));

router.post("/", createDialysisSession);
router.get("/", getDialysisSessions);
router.get("/:id", getDialysisSessionById);
router.put("/:id", updateDialysisSession);
router.delete("/:id", deleteDialysisSession);
router.patch("/:id/agreement/acknowledge", acknowledgeAgreement);
router.patch("/:id/agreement/sign", signAgreement);
router.patch("/:id/agreement/heparin", updateAgreementHeparin);
router.patch("/:id/cash-reason", updateCashReason);

export default router;
