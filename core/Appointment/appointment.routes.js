import express from "express";
import appointmentController from "./appointment.controller.js";
import { protect, restrictTo } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, restrictTo("patient"), appointmentController.bookAppointment);
router.get("/my", protect, restrictTo("patient"), appointmentController.getMyAppointments);
router.get("/:id", protect, appointmentController.getAppointmentById);
router.put("/:id/cancel", protect, restrictTo("patient"), appointmentController.cancelAppointment);

export default router;
