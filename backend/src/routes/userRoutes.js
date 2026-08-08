import express from "express";
import { createUser, getOnlineDirectory, getUsers, updateUser, updateUserPassword, updateUserStatus } from "../controllers/userController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/online-directory", getOnlineDirectory);
router.use(adminOnly);
router.post("/", createUser);
router.get("/", getUsers);
router.patch("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.patch("/:id/password", updateUserPassword);

export default router;
