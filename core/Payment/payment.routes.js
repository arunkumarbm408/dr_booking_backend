import express from "express";
import paymentController from "./payment.controller.js";
import { protect, restrictTo } from "../../middlewares/authMiddleware.js";
import { uploadPaymentScreenshot } from "../../middlewares/uploadMiddleware.js";

const router = express.Router();

// Patient routes
router.post("/", protect, restrictTo("patient"), paymentController.createPayment);
router.get("/my", protect, restrictTo("patient"), paymentController.getMyPayments);
router.post("/:id/screenshot", protect, restrictTo("patient"), uploadPaymentScreenshot, paymentController.uploadScreenshot);

// Doctor routes
router.get("/doctor", protect, restrictTo("doctor"), paymentController.getDoctorPayments);

// Admin/Doctor routes
router.put("/:id/status", protect, restrictTo("admin", "doctor"), paymentController.updatePaymentStatus);

// Shared protected route
router.get("/:id", protect, paymentController.getPaymentById);

export default router;
