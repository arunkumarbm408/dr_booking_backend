import express from "express";
import doctorController from "./doctor.controller.js";
import { protect, restrictTo, requireApprovedDoctor } from "../../middlewares/authMiddleware.js";
import { uploadProfileImage, uploadDocuments } from "../../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", doctorController.getDoctors);
router.get("/:id", doctorController.getDoctorById);

// View own profile — allowed even when pending (so doctor can see their status)
router.get("/me/profile", protect, restrictTo("doctor"), doctorController.getMyProfile);

// All other doctor actions require an approved profile
router.put("/me/profile", protect, restrictTo("doctor"), requireApprovedDoctor, uploadProfileImage, doctorController.updateMyProfile);
router.post("/me/availability", protect, restrictTo("doctor"), requireApprovedDoctor, doctorController.setAvailability);
router.post("/me/profile-image", protect, restrictTo("doctor"), requireApprovedDoctor, uploadProfileImage, doctorController.uploadProfileImage);
router.post("/me/documents", protect, restrictTo("doctor"), requireApprovedDoctor, uploadDocuments, doctorController.uploadDocuments);
router.get("/me/appointments", protect, restrictTo("doctor"), requireApprovedDoctor, doctorController.getMyAppointments);
router.put("/me/appointments/:id/status", protect, restrictTo("doctor"), requireApprovedDoctor, doctorController.updateAppointmentStatus);

export default router;
