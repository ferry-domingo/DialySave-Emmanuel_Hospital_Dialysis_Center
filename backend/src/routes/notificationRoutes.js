import express from "express";
import { createNotification, deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead, updateNotification } from "../controllers/notificationController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
router.use(protect);
router.get("/", getNotifications);
router.post("/", roleOnly(ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER), createNotification);
router.put("/:id", roleOnly(ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER), updateNotification);
router.delete("/:id", roleOnly(ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER), deleteNotification);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
