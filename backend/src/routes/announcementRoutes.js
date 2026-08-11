import express from "express";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, getPublicAnnouncements, updateAnnouncement } from "../controllers/announcementController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
router.get("/public", getPublicAnnouncements);
router.use(protect);
router.get("/", getAnnouncements);
router.post("/", roleOnly(ROLES.ADMIN), createAnnouncement);
router.put("/:id", roleOnly(ROLES.ADMIN), updateAnnouncement);
router.delete("/:id", roleOnly(ROLES.ADMIN), deleteAnnouncement);

export default router;
