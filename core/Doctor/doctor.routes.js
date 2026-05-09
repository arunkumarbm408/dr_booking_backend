import express from "express";
import doctorController from "./doctor.controller.js";
import { protect, restrictTo } from "../../middlewares/authMiddleware.js";
import { uploadProfileImage, uploadDocuments } from "../../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", doctorController.getDoctors);
router.get("/:id", doctorController.getDoctorById);

// Protected: doctor only
router.post("/profile", protect, restrictTo("doctor"), doctorController.createProfile);
router.get("/me/profile", protect, restrictTo("doctor"), doctorController.getMyProfile);
router.put("/me/profile", protect, restrictTo("doctor"), doctorController.updateMyProfile);
router.post("/me/availability", protect, restrictTo("doctor"), doctorController.setAvailability);
router.post("/me/profile-image", protect, restrictTo("doctor"), uploadProfileImage, doctorController.uploadProfileImage);
router.post("/me/documents", protect, restrictTo("doctor"), uploadDocuments, doctorController.uploadDocuments);
router.get("/me/appointments", protect, restrictTo("doctor"), doctorController.getMyAppointments);
router.put("/me/appointments/:id/status", protect, restrictTo("doctor"), doctorController.updateAppointmentStatus);

export default router;
