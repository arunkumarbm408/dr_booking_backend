import express from "express";
import authRoutes from "../../core/Auth/auth.routes.js";
import doctorRoutes from "../../core/Doctor/doctor.routes.js";
import appointmentRoutes from "../../core/Appointment/appointment.routes.js";
import paymentRoutes from "../../core/Payment/payment.routes.js";
import adminRoutes from "../../core/Admin/admin.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

export default router;
