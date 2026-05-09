import express from "express";
import adminController from "./admin.controller.js";
import { protect, restrictTo } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/toggle-status", adminController.toggleUserStatus);
router.get("/doctors", adminController.getAllDoctors);
router.put("/doctors/:id/approve", adminController.approveDoctorProfile);
router.get("/appointments", adminController.getAllAppointments);
router.get("/payments", adminController.getAllPayments);

export default router;
