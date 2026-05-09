import logger from "../../utils/logger.js";
import Payment from "./payment.model.js";
import Appointment from "../Appointment/appointment.model.js";
import Doctor from "../Doctor/doctor.model.js";
import { createPaymentSchema, updatePaymentStatusSchema } from "./payment.validation.js";
import { safeEmit } from "../../utils/socket.js";

class PaymentService {
  async createPayment(req, res) {
    try {
      const { error, value } = createPaymentSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const [appointment, existing] = await Promise.all([
        Appointment.findOne({ _id: value.appointmentId, patient: req.user._id }),
        Payment.findOne({ appointment: value.appointmentId }),
      ]);

      if (!appointment) return res.status(404).json({ status: "fail", message: "Appointment not found" });
      if (appointment.paymentStatus === "Paid") return res.status(400).json({ status: "fail", message: "Payment already submitted for this appointment" });
      if (existing) return res.status(400).json({ status: "fail", message: "Payment record already exists for this appointment" });

      if (!value.amount) {
        const doctor = await Doctor.findById(appointment.doctor).select("fees");
        value.amount = doctor?.fees || 0;
      }

      const payment = await Payment.create({
        patient: req.user._id,
        doctor: appointment.doctor,
        appointment: appointment._id,
        amount: value.amount,
        method: value.method || "PhonePe",
        utrId: value.utrId || "",
      });

      await payment.populate([
        { path: "patient", select: "name email" },
        { path: "doctor", populate: { path: "user", select: "name" } },
        { path: "appointment", select: "appointmentDate timeSlot status" },
      ]);

      safeEmit("user:admin", "payment:new", {
        payment: payment.toObject(),
        message: `New payment submitted by ${payment.patient?.name || "a patient"}`,
      });

      return res.status(201).json({ status: "success", message: "Payment record created. Awaiting verification.", data: payment });
    } catch (err) {
      logger.error(`CreatePayment: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to create payment record" });
    }
  }

  async uploadScreenshot(req, res) {
    try {
      if (!req.file) return res.status(400).json({ status: "fail", message: "No screenshot file uploaded" });

      const payment = await Payment.findOne({ _id: req.params.id, patient: req.user._id });
      if (!payment) return res.status(404).json({ status: "fail", message: "Payment not found" });

      payment.screenshot = `/uploads/${req.file.filename}`;
      if (req.body.utrId) payment.utrId = req.body.utrId;
      await payment.save();

      return res.status(200).json({ status: "success", message: "Screenshot uploaded", data: { screenshot: payment.screenshot } });
    } catch (err) {
      logger.error(`UploadScreenshot: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to upload screenshot" });
    }
  }

  async getMyPayments(req, res) {
    try {
      const { skip = 0, limit = 20 } = req.query;

      const [payments, total] = await Promise.all([
        Payment.find({ patient: req.user._id })
          .populate({ path: "doctor", populate: { path: "user", select: "name" } })
          .populate("appointment", "appointmentDate timeSlot status")
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        Payment.countDocuments({ patient: req.user._id }),
      ]);

      return res.status(200).json({ status: "success", message: "Payments fetched", data: { total, payments } });
    } catch (err) {
      logger.error(`GetMyPayments: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch payments" });
    }
  }

  async getDoctorPayments(req, res) {
    try {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor profile not found" });

      const { skip = 0, limit = 20, status } = req.query;
      const filter = { doctor: doctor._id };
      if (status) filter.status = status;

      const [payments, total] = await Promise.all([
        Payment.find(filter)
          .populate("patient", "name email phone")
          .populate("appointment", "appointmentDate timeSlot status")
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        Payment.countDocuments(filter),
      ]);

      return res.status(200).json({ status: "success", message: "Payments fetched", data: { total, payments } });
    } catch (err) {
      logger.error(`GetDoctorPayments: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch payments" });
    }
  }

  async updatePaymentStatus(req, res) {
    try {
      const { error, value } = updatePaymentStatusSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const payment = await Payment.findById(req.params.id);
      if (!payment) return res.status(404).json({ status: "fail", message: "Payment not found" });

      payment.status = value.status;
      if (value.adminNote) payment.adminNote = value.adminNote;

      const newPaymentStatus = value.status === "Approved" ? "Paid" : "Pending";

      const [, , doctorDoc] = await Promise.all([
        payment.save(),
        Appointment.findByIdAndUpdate(payment.appointment, { paymentStatus: newPaymentStatus }),
        Doctor.findById(payment.doctor).select("user"),
      ]);

      const socketPayload = {
        paymentId: payment._id,
        appointmentId: payment.appointment?.toString(),
        status: payment.status,
      };
      safeEmit(`user:${payment.patient.toString()}`, "payment:verified", {
        ...socketPayload,
        message: `Your payment has been ${payment.status.toLowerCase()}`,
      });
      if (doctorDoc?.user) {
        safeEmit(`user:${doctorDoc.user.toString()}`, "payment:verified", {
          ...socketPayload,
          message: `Patient payment has been ${payment.status.toLowerCase()}`,
        });
      }

      return res.status(200).json({ status: "success", message: "Payment status updated", data: payment });
    } catch (err) {
      logger.error(`UpdatePaymentStatus: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update payment status" });
    }
  }

  async getPaymentById(req, res) {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate("patient", "name email")
        .populate({ path: "doctor", populate: { path: "user", select: "name" } })
        .populate("appointment", "appointmentDate timeSlot status paymentStatus")
        .select("-__v");

      if (!payment) return res.status(404).json({ status: "fail", message: "Payment not found" });

      return res.status(200).json({ status: "success", message: "Payment fetched", data: payment });
    } catch (err) {
      logger.error(`GetPaymentById: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch payment" });
    }
  }
}

export default new PaymentService();
