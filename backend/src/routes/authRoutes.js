import express from "express";
import {
  changeMyPassword,
  getMe,
  loginUser,
  logoutUser,
  requestEmailChange,
  updateMyProfile,
  verifyEmailChange,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMyProfile);
router.post("/me/email/request", protect, requestEmailChange);
router.post("/me/email/verify", protect, verifyEmailChange);
router.patch("/me/password", protect, changeMyPassword);

export default router;
