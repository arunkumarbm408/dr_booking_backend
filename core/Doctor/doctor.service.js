import logger from "../../utils/logger.js";
import Doctor from "./doctor.model.js";
import Appointment from "../Appointment/appointment.model.js";
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
      if (existing) {
        return res.status(400).json({ status: "fail", message: "Doctor profile already exists" });
      }

      const { error, value } = createDoctorProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

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
      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor profile not found. Please create one." });
      }
      return res.status(200).json({ status: "success", message: "Profile fetched", data: doctor });
    } catch (err) {
      logger.error(`GetMyProfile: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch profile" });
    }
  }

  async updateMyProfile(req, res) {
    try {
      const { error, value } = updateDoctorProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

      const doctor = await Doctor.findOneAndUpdate({ user: req.user._id }, value, {
        new: true,
        runValidators: true,
      }).populate("user", "name email phone");

      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor profile not found" });
      }

      return res.status(200).json({ status: "success", message: "Profile updated", data: doctor });
    } catch (err) {
      logger.error(`UpdateMyProfile: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update profile" });
    }
  }

  async setAvailability(req, res) {
    try {
      const { error, value } = availabilitySlotsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

      const doctor = await Doctor.findOneAndUpdate(
        { user: req.user._id },
        { availabilitySlots: value.slots },
        { new: true }
      );

      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor profile not found" });
      }

      return res.status(200).json({
        status: "success",
        message: "Availability updated",
        data: doctor.availabilitySlots,
      });
    } catch (err) {
      logger.error(`SetAvailability: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update availability" });
    }
  }

  async uploadProfileImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ status: "fail", message: "No image file uploaded" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      const doctor = await Doctor.findOneAndUpdate(
        { user: req.user._id },
        { profileImage: imageUrl },
        { new: true }
      );

      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor profile not found" });
      }

      return res.status(200).json({ status: "success", message: "Profile image uploaded", data: { profileImage: imageUrl } });
    } catch (err) {
      logger.error(`UploadProfileImage: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to upload image" });
    }
  }

  async uploadDocuments(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ status: "fail", message: "No document files uploaded" });
      }

      const docUrls = req.files.map((f) => `/uploads/${f.filename}`);

      const doctor = await Doctor.findOneAndUpdate(
        { user: req.user._id },
        { $push: { documents: { $each: docUrls } } },
        { new: true }
      );

      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor profile not found" });
      }

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

      let query = Doctor.find(filter)
        .populate("user", "name email phone")
        .select("-documents -__v")
        .skip(skip)
        .limit(limit)
        .sort({ averageRating: -1, createdAt: -1 });

      if (search) {
        const userIds = await import("../User/user.model.js").then(({ default: User }) =>
          User.find({ name: { $regex: search, $options: "i" } }, "_id")
        );
        filter.$or = [
          { specialization: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { user: { $in: userIds.map((u) => u._id) } },
        ];
        query = Doctor.find(filter)
          .populate("user", "name email phone")
          .select("-documents -__v")
          .skip(skip)
          .limit(limit);
      }

      const [doctors, total] = await Promise.all([query, Doctor.countDocuments(filter)]);

      return res.status(200).json({
        status: "success",
        message: "Doctors fetched",
        data: { total, doctors },
      });
    } catch (err) {
      logger.error(`GetDoctors: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch doctors" });
    }
  }

  async getDoctorById(req, res) {
    try {
      const doctor = await Doctor.findById(req.params.id)
        .populate("user", "name email phone")
        .select("-documents -__v");

      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor not found" });
      }

      return res.status(200).json({ status: "success", message: "Doctor fetched", data: doctor });
    } catch (err) {
      logger.error(`GetDoctorById: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch doctor" });
    }
  }

  async getMyAppointments(req, res) {
    try {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor profile not found" });
      }

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

      return res.status(200).json({
        status: "success",
        message: "Appointments fetched",
        data: { total, appointments },
      });
    } catch (err) {
      logger.error(`GetMyAppointments (doctor): ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch appointments" });
    }
  }

  async updateAppointmentStatus(req, res) {
    try {
      const { error, value } = updateAppointmentStatusSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(404).json({ status: "fail", message: "Doctor profile not found" });
      }

      const appointment = await Appointment.findOne({
        _id: req.params.id,
        doctor: doctor._id,
      });

      if (!appointment) {
        return res.status(404).json({ status: "fail", message: "Appointment not found" });
      }

      if (["Cancelled", "Completed"].includes(appointment.status)) {
        return res.status(400).json({
          status: "fail",
          message: `Cannot update a ${appointment.status.toLowerCase()} appointment`,
        });
      }

      appointment.status = value.status;
      if (value.notes) appointment.notes = value.notes;
      await appointment.save();

      return res.status(200).json({ status: "success", message: "Appointment status updated", data: appointment });
    } catch (err) {
      logger.error(`UpdateAppointmentStatus: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update appointment status" });
    }
  }
}

export default new DoctorService();
