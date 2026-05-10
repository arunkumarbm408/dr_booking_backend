import logger from "../../utils/logger.js";
import Doctor from "./doctor.model.js";

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function validateSlotsNoOverlap(slots) {
  const byDay = {};
  for (const s of slots) {
    (byDay[s.day] = byDay[s.day] || []).push(s);
  }
  for (const [day, daySlots] of Object.entries(byDay)) {
    for (const s of daySlots) {
      if (toMinutes(s.startTime) >= toMinutes(s.endTime)) {
        return `${day}: startTime must be before endTime (${s.startTime}–${s.endTime})`;
      }
    }
    const sorted = [...daySlots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (toMinutes(curr.startTime) < toMinutes(prev.endTime)) {
        return `${day}: slots ${prev.startTime}–${prev.endTime} and ${curr.startTime}–${curr.endTime} overlap`;
      }
    }
  }
  return null;
}
import Appointment from "../Appointment/appointment.model.js";
import { safeEmit } from "../../utils/socket.js";
import {
  createDoctorProfileSchema,
  updateDoctorProfileSchema,
  availabilitySlotsSchema,
  updateAppointmentStatusSchema,
} from "./doctor.validation.js";

class DoctorService {
  async createProfile(req, res) {
    try {
      const existing = await Doctor.findOne({ user: req.user._id });
      if (existing) return res.status(400).json({ status: "fail", message: "Doctor profile already exists" });

      const { error, value } = createDoctorProfileSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const doctor = await Doctor.create({ ...value, user: req.user._id });
      await doctor.populate("user", "name email phone");

      return res.status(201).json({
        status: "success",
        message: "Doctor profile created. Awaiting admin approval.",
        data: doctor,
      });
    } catch (err) {
      logger.error(`CreateDoctorProfile: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to create doctor profile" });
    }
  }

  async getMyProfile(req, res) {
    try {
      const doctor = await Doctor.findOne({ user: req.user._id }).populate("user", "name email phone location");
      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor profile not found. Please create one." });
      return res.status(200).json({ status: "success", message: "Profile fetched", data: doctor });
    } catch (err) {
      logger.error(`GetMyProfile: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch profile" });
    }
  }

  async updateMyProfile(req, res) {
    try {
      let body = { ...req.body };

      if (body.experience !== undefined) body.experience = Number(body.experience);
      if (body.fees !== undefined) body.fees = Number(body.fees);

      if (typeof body.qualifications === "string") {
        body.qualifications = body.qualifications.split(",").map((q) => q.trim()).filter(Boolean);
      }

      let parsedSlots = null;
      if (typeof body.availabilitySlots === "string" && body.availabilitySlots.trim()) {
        try {
          parsedSlots = JSON.parse(body.availabilitySlots);
        } catch {
          return res.status(400).json({ status: "fail", message: "availabilitySlots must be valid JSON" });
        }
        delete body.availabilitySlots;
      }

      const { error, value } = updateDoctorProfileSchema.validate(body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      if (req.file) value.profileImage = `/uploads/${req.file.filename}`;
      if (parsedSlots) {
        const overlapError = validateSlotsNoOverlap(parsedSlots);
        if (overlapError) return res.status(400).json({ status: "fail", message: overlapError });
        value.availabilitySlots = parsedSlots;
      }

      const doctor = await Doctor.findOneAndUpdate(
        { user: req.user._id },
        { ...value, user: req.user._id },
        { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
      ).populate("user", "name email phone");

      return res.status(200).json({ status: "success", message: "Profile updated", data: doctor });
    } catch (err) {
      logger.error(`UpdateMyProfile: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update profile" });
    }
  }

  async setAvailability(req, res) {
    try {
      const { error, value } = availabilitySlotsSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const overlapError = validateSlotsNoOverlap(value.slots);
      if (overlapError) return res.status(400).json({ status: "fail", message: overlapError });

      const doctor = await Doctor.findOneAndUpdate(
        { user: req.user._id },
        { availabilitySlots: value.slots },
        { new: true }
      );
      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor profile not found" });

      return res.status(200).json({ status: "success", message: "Availability updated", data: doctor.availabilitySlots });
    } catch (err) {
      logger.error(`SetAvailability: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update availability" });
    }
  }

  async uploadProfileImage(req, res) {
    try {
      if (!req.file) return res.status(400).json({ status: "fail", message: "No image file uploaded" });

      const imageUrl = `/uploads/${req.file.filename}`;
      const doctor = await Doctor.findOneAndUpdate(
        { user: req.user._id },
        { profileImage: imageUrl },
        { new: true }
      );
      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor profile not found" });

      return res.status(200).json({ status: "success", message: "Profile image uploaded", data: { profileImage: imageUrl } });
    } catch (err) {
      logger.error(`UploadProfileImage: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to upload image" });
    }
  }

  async uploadDocuments(req, res) {
    try {
      if (!req.files || req.files.length === 0) return res.status(400).json({ status: "fail", message: "No document files uploaded" });

      const docUrls = req.files.map((f) => `/uploads/${f.filename}`);
      const doctor = await Doctor.findOneAndUpdate(
        { user: req.user._id },
        { $push: { documents: { $each: docUrls } } },
        { new: true }
      );
      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor profile not found" });

      return res.status(200).json({ status: "success", message: "Documents uploaded", data: { documents: doctor.documents } });
    } catch (err) {
      logger.error(`UploadDocuments: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to upload documents" });
    }
  }

  async getDoctors(req, res) {
    try {
      let { skip = 0, limit = 10, specialization, location, search } = req.query;
      skip = parseInt(skip);
      limit = parseInt(limit);

      const filter = { isApproved: true };
      if (specialization) filter.specialization = { $regex: specialization, $options: "i" };
      if (location) filter.location = { $regex: location, $options: "i" };
      if (search) {
        filter.$or = [
          { specialization: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }

      const [doctors, total] = await Promise.all([
        Doctor.find(filter)
          .populate("user", "name email phone")
          .select("-documents -__v")
          .skip(skip)
          .limit(limit)
          .sort({ averageRating: -1, createdAt: -1 }),
        Doctor.countDocuments(filter),
      ]);

      return res.status(200).json({ status: "success", message: "Doctors fetched", data: { total, doctors } });
    } catch (err) {
      logger.error(`GetDoctors: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch doctors" });
    }
  }

  async getDoctorById(req, res) {
    try {
      const [doctor, bookedSlots] = await Promise.all([
        Doctor.findById(req.params.id).populate("user", "name email phone").select("-documents -__v"),
        Appointment.find({ doctor: req.params.id, status: { $nin: ["Rejected", "Cancelled"] } })
          .select("appointmentDate timeSlot")
          .sort({ appointmentDate: 1 })
          .lean(),
      ]);

      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor not found" });

      return res.status(200).json({ status: "success", message: "Doctor fetched", data: { doctor, bookedSlots } });
    } catch (err) {
      logger.error(`GetDoctorById: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch doctor" });
    }
  }

  async getMyAppointments(req, res) {
    try {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor profile not found" });

      const { status, date, skip = 0, limit = 20 } = req.query;
      const filter = { doctor: doctor._id };
      if (status) filter.status = status;
      if (date) filter.appointmentDate = date;

      const [appointments, total] = await Promise.all([
        Appointment.find(filter)
          .populate("patient", "name email phone")
          .sort({ appointmentDate: 1, timeSlot: 1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        Appointment.countDocuments(filter),
      ]);

      return res.status(200).json({ status: "success", message: "Appointments fetched", data: { total, appointments } });
    } catch (err) {
      logger.error(`GetMyAppointments (doctor): ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch appointments" });
    }
  }

  async updateAppointmentStatus(req, res) {
    try {
      const { error, value } = updateAppointmentStatusSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor profile not found" });

      const appointment = await Appointment.findOne({ _id: req.params.id, doctor: doctor._id });
      if (!appointment) return res.status(404).json({ status: "fail", message: "Appointment not found" });

      if (["Cancelled", "Completed"].includes(appointment.status)) {
        return res.status(400).json({ status: "fail", message: `Cannot update a ${appointment.status.toLowerCase()} appointment` });
      }

      appointment.status = value.status;
      if (value.notes) appointment.notes = value.notes;
      await appointment.save();

      const apptObj = appointment.toObject();
      safeEmit(`user:${appointment.patient.toString()}`, "appointment:updated", {
        appointment: apptObj,
        message: `Your appointment has been ${value.status.toLowerCase()}`,
      });
      safeEmit("user:admin", "appointment:updated", {
        appointment: apptObj,
        message: `Appointment status changed to ${value.status} by doctor`,
      });

      return res.status(200).json({ status: "success", message: "Appointment status updated", data: appointment });
    } catch (err) {
      logger.error(`UpdateAppointmentStatus: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update appointment status" });
    }
  }
}

export default new DoctorService();
