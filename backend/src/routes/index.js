import express from "express";
import patientRoutes from "./patientRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import dialysisSessionRoutes from "./dialysisSessionRoutes.js";
import monitoringRoutes from "./monitoringRoutes.js";
import admissionReportRoutes from "./admissionReportRoutes.js";
import authRoutes from "./authRoutes.js";
import patientPortalRoutes from "./patientPortalRoutes.js";
import userRoutes from "./userRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import messageRoutes from "./messageRoutes.js";
import activityLogRoutes from "./activityLogRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import announcementRoutes from "./announcementRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/dialysis-sessions", dialysisSessionRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/admission-report", admissionReportRoutes);
router.use("/patient-portal", patientPortalRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/messages", messageRoutes);
router.use("/activity-logs", activityLogRoutes);
router.use("/notifications", notificationRoutes);
router.use("/announcements", announcementRoutes);

export default router;
