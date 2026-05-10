import express from "express";
import authController from "./auth.controller.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { uploadDoctorRegistration } from "../../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/doctor-register", uploadDoctorRegistration, authController.doctorRegister);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe);
router.put("/me", protect, authController.updateMe);
router.put("/change-password", protect, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

export default router;
