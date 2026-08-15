import express from "express";
import { createTechnologyPhoto, deleteTechnologyPhoto, getTechnologyPhotoImage, getTechnologyPhotos, setTechnologyPhotoHomeFeature, updateTechnologyPhoto } from "../controllers/technologyGalleryController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
router.get("/", getTechnologyPhotos);
router.get("/:id/image", getTechnologyPhotoImage);
router.use(protect);
router.post("/", roleOnly(ROLES.ADMIN), createTechnologyPhoto);
router.put("/:id", roleOnly(ROLES.ADMIN), updateTechnologyPhoto);
router.patch("/:id/home", roleOnly(ROLES.ADMIN), setTechnologyPhotoHomeFeature);
router.delete("/:id", roleOnly(ROLES.ADMIN), deleteTechnologyPhoto);

export default router;
