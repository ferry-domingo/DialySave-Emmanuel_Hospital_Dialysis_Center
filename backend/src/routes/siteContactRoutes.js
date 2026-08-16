import express from "express";
import { getSiteContact, updateSiteContact } from "../controllers/siteContactController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
router.get("/", getSiteContact);
router.put("/", protect, roleOnly(ROLES.ADMIN), updateSiteContact);

export default router;
