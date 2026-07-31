import express from "express";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getMyDoctorDashboard,
} from "../controllers/doctorController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
router.use(protect);

router.get("/me/dashboard", roleOnly(ROLES.DOCTOR), getMyDoctorDashboard);
router.post("/", roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), createDoctor);
router.get("/", roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), getDoctors);
router.get("/:id", roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), getDoctorById);
router.put("/:id", roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), updateDoctor);
router.delete("/:id", roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), deleteDoctor);

export default router;
