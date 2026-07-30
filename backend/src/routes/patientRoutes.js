import express from "express";
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import { protect, roleOnly, roleOrOwnPatient } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
const operationalOnly = roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER);

router.use(protect);
router.post("/", operationalOnly, createPatient);
router.get("/", operationalOnly, getPatients);
router.get("/:id", roleOrOwnPatient(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), getPatientById);
router.put("/:id", operationalOnly, updatePatient);
router.delete("/:id", operationalOnly, deletePatient);

export default router;
