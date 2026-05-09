import logger from "../../utils/logger.js";
import Appointment from "./appointment.model.js";
import Doctor from "../Doctor/doctor.model.js";
import { bookAppointmentSchema, cancelAppointmentSchema } from "./appointment.validation.js";

class AppointmentService {
  async bookAppointment(req, res) {
    try {
      const { error, value } = bookAppointmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

      const doctor = await Doctor.findById(value.doctorId);
      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor not found" });
      }
      if (!doctor.isApproved) {
        return res.status(400).json({ status: "fail", message: "This doctor is not approved for booking yet" });
      }

      // Check the requested day's slot exists
      const date = new Date(value.appointmentDate);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      const slot = doctor.availabilitySlots.find((s) => s.day === dayName);
      if (!slot) {
        return res.status(400).json({
          status: "fail",
          message: `Doctor is not available on ${dayName}`,
        });
      }

      // Prevent double-booking for the same doctor/date/slot
      const existing = await Appointment.findOne({
        doctor: doctor._id,
        appointmentDate: value.appointmentDate,
        timeSlot: value.timeSlot,
        status: { $nin: ["Rejected", "Cancelled"] },
      });
      if (existing) {
        return res.status(400).json({ status: "fail", message: "This time slot is already booked" });
      }

      // Prevent patient from double-booking same doctor same day
      const patientDup = await Appointment.findOne({
        patient: req.user._id,
        doctor: doctor._id,
        appointmentDate: value.appointmentDate,
        status: { $nin: ["Rejected", "Cancelled"] },
      });
      if (patientDup) {
        return res.status(400).json({
          status: "fail",
          message: "You already have an appointment with this doctor on that date",
        });
      }

      const appointment = await Appointment.create({
        patient: req.user._id,
        doctor: doctor._id,
        appointmentDate: value.appointmentDate,
        timeSlot: value.timeSlot,
        symptoms: value.symptoms || "",
        paymentMethod: value.paymentMethod,
      });

      await appointment.populate([
        { path: "patient", select: "name email phone" },
        { path: "doctor", populate: { path: "user", select: "name" } },
      ]);

      return res.status(201).json({
        status: "success",
        message: "Appointment booked successfully",
        data: appointment,
      });
    } catch (err) {
      logger.error(`BookAppointment: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to book appointment" });
    }
  }

  async getMyAppointments(req, res) {
    try {
      const { status, skip = 0, limit = 20 } = req.query;
      const filter = { patient: req.user._id };
      if (status) filter.status = status;

      const [appointments, total] = await Promise.all([
        Appointment.find(filter)
          .populate({ path: "doctor", populate: { path: "user", select: "name email" } })
          .sort({ appointmentDate: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        Appointment.countDocuments(filter),
      ]);

      return res.status(200).json({
        status: "success",
        message: "Appointments fetched",
        data: { total, appointments },
      });
    } catch (err) {
      logger.error(`GetMyAppointments (patient): ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch appointments" });
    }
  }

  async getAppointmentById(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate("patient", "name email phone")
        .populate({ path: "doctor", populate: { path: "user", select: "name email" } })
        .select("-__v");

      if (!appointment) {
        return res.status(404).json({ status: "fail", message: "Appointment not found" });
      }

      const isOwner =
        appointment.patient._id.toString() === req.user._id.toString() ||
        req.user.role === "admin";

      if (!isOwner) {
        // Also allow the doctor who owns it
        const doctor = await Doctor.findOne({ user: req.user._id });
        if (!doctor || appointment.doctor._id.toString() !== doctor._id.toString()) {
          return res.status(403).json({ status: "fail", message: "Access denied" });
        }
      }

      return res.status(200).json({ status: "success", message: "Appointment fetched", data: appointment });
    } catch (err) {
      logger.error(`GetAppointmentById: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch appointment" });
    }
  }

  async cancelAppointment(req, res) {
    try {
      const { error, value } = cancelAppointmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

      const appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.user._id,
      });

      if (!appointment) {
        return res.status(404).json({ status: "fail", message: "Appointment not found" });
      }

      if (["Cancelled", "Completed"].includes(appointment.status)) {
        return res.status(400).json({
          status: "fail",
          message: `Appointment is already ${appointment.status.toLowerCase()}`,
        });
      }

      const previousStatus = appointment.status;
      appointment.status = "Cancelled";
      appointment.cancelledAt = new Date();

      // Mark refund eligible if appointment was approved and had been paid
      if (previousStatus === "Approved" && appointment.paymentStatus === "Paid") {
        appointment.refundEligible = true;
      }
      if (value.reason) appointment.notes = value.reason;

      await appointment.save();

      return res.status(200).json({ status: "success", message: "Appointment cancelled", data: appointment });
    } catch (err) {
      logger.error(`CancelAppointment: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to cancel appointment" });
    }
  }
}

export default new AppointmentService();
