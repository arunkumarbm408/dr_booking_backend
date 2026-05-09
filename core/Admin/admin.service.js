import logger from "../../utils/logger.js";
import User from "../User/user.model.js";
import Doctor from "../Doctor/doctor.model.js";
import Appointment from "../Appointment/appointment.model.js";
import Payment from "../Payment/payment.model.js";
import { safeEmit } from "../../utils/socket.js";
import { sendEmail, emailTemplates } from "../../utils/email.js";

class AdminService {
  async getDashboard(req, res) {
    try {
      const [totalUsers, totalDoctors, pendingDoctors, totalAppointments, pendingAppointments, totalPayments, pendingPayments] =
        await Promise.all([
          User.countDocuments(),
          Doctor.countDocuments({ isApproved: true }),
          Doctor.countDocuments({ isApproved: false }),
          Appointment.countDocuments(),
          Appointment.countDocuments({ status: "Pending" }),
          Payment.countDocuments(),
          Payment.countDocuments({ status: "Pending" }),
        ]);

      return res.status(200).json({
        status: "success",
        message: "Dashboard stats fetched",
        data: {
          users: { total: totalUsers },
          doctors: { approved: totalDoctors, pending: pendingDoctors },
          appointments: { total: totalAppointments, pending: pendingAppointments },
          payments: { total: totalPayments, pending: pendingPayments },
        },
      });
    } catch (err) {
      logger.error(`GetDashboard: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch dashboard stats" });
    }
  }

  async getAllUsers(req, res) {
    try {
      const { role, skip = 0, limit = 20 } = req.query;
      const filter = {};
      if (role) filter.role = role;

      const [users, total] = await Promise.all([
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        User.countDocuments(filter),
      ]);

      return res.status(200).json({ status: "success", message: "Users fetched", data: { total, users } });
    } catch (err) {
      logger.error(`GetAllUsers: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch users" });
    }
  }

  async toggleUserStatus(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ status: "fail", message: "User not found" });
      }
      if (user.role === "admin") {
        return res.status(400).json({ status: "fail", message: "Cannot modify an admin account" });
      }

      user.isActive = !user.isActive;
      await user.save();

      return res.status(200).json({
        status: "success",
        message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
        data: { id: user._id, isActive: user.isActive },
      });
    } catch (err) {
      logger.error(`ToggleUserStatus: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update user status" });
    }
  }

  async getAllDoctors(req, res) {
    try {
      const { isApproved, skip = 0, limit = 20 } = req.query;
      const filter = {};
      if (isApproved !== undefined) filter.isApproved = isApproved === "true";

      const [doctors, total] = await Promise.all([
        Doctor.find(filter)
          .populate("user", "name email phone isActive")
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        Doctor.countDocuments(filter),
      ]);

      return res.status(200).json({ status: "success", message: "Doctors fetched", data: { total, doctors } });
    } catch (err) {
      logger.error(`GetAllDoctors (admin): ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch doctors" });
    }
  }

  async approveDoctorProfile(req, res) {
    try {
      const { isApproved, rejectionReason } = req.body;
      if (typeof isApproved !== "boolean") {
        return res.status(400).json({ status: "fail", message: "isApproved must be a boolean" });
      }

      const action = isApproved ? "Approved" : "Rejected";
      const update = {
        $set: {
          isApproved,
          verificationStatus: action,
          rejectionReason: !isApproved && rejectionReason ? rejectionReason : "",
        },
        $push: {
          verificationHistory: {
            action,
            byName: req.user.name,
            at: new Date(),
            note: !isApproved && rejectionReason ? rejectionReason : "",
          },
        },
      };

      const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true })
        .populate("user", "name email phone isActive");

      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor not found" });
      if (!doctor.user) return res.status(404).json({ status: "fail", message: "Linked user account not found" });

      await User.findByIdAndUpdate(doctor.user._id, { isActive: isApproved });

      const emailResult = isApproved
        ? await sendEmail({
            to: doctor.user.email,
            subject: "Congratulations! Your Doctor Account is Approved — Doctor Book",
            html: emailTemplates.approved(doctor.user.name, doctor.user.email),
          })
        : await sendEmail({
            to: doctor.user.email,
            subject: "Doctor Application Status Update — Doctor Book",
            html: emailTemplates.rejected(doctor.user.name, rejectionReason || ""),
          });

      await Doctor.findByIdAndUpdate(doctor._id, {
        $push: {
          emailLog: {
            type: isApproved ? "approved" : "rejected",
            sentAt: new Date(),
            status: emailResult.success ? "sent" : "failed",
            messageId: emailResult.messageId || "",
          },
        },
      });

      safeEmit(`user:${doctor.user._id.toString()}`, "doctor:approved", {
        isApproved: doctor.isApproved,
        message: `Your doctor profile has been ${action.toLowerCase()}`,
      });

      return res.status(200).json({
        status: "success",
        message: `Doctor profile ${action.toLowerCase()}`,
        data: doctor,
      });
    } catch (err) {
      logger.error(`ApproveDoctorProfile: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update doctor status" });
    }
  }

  async requestMoreInfo(req, res) {
    try {
      const { message } = req.body;
      if (!message?.trim()) {
        return res.status(400).json({ status: "fail", message: "A message is required" });
      }

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        {
          $set: { verificationStatus: "Info Requested" },
          $push: {
            verificationHistory: {
              action: "Info Requested",
              byName: req.user.name,
              at: new Date(),
              note: message,
            },
          },
        },
        { new: true }
      ).populate("user", "name email phone isActive");

      if (!doctor) return res.status(404).json({ status: "fail", message: "Doctor not found" });

      const emailResult = await sendEmail({
        to: doctor.user.email,
        subject: "Additional Information Required — Doctor Book",
        html: emailTemplates.infoRequested(doctor.user.name, message),
      });

      await Doctor.findByIdAndUpdate(doctor._id, {
        $push: {
          emailLog: {
            type: "infoRequested",
            sentAt: new Date(),
            status: emailResult.success ? "sent" : "failed",
            messageId: emailResult.messageId || "",
          },
        },
      });

      return res.status(200).json({
        status: "success",
        message: "Information request sent to doctor",
        data: doctor,
      });
    } catch (err) {
      logger.error(`RequestMoreInfo: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to send info request" });
    }
  }

  async getAllAppointments(req, res) {
    try {
      const { status, skip = 0, limit = 20 } = req.query;
      const filter = {};
      if (status) filter.status = status;

      const [appointments, total] = await Promise.all([
        Appointment.find(filter)
          .populate("patient", "name email")
          .populate({ path: "doctor", populate: { path: "user", select: "name" } })
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        Appointment.countDocuments(filter),
      ]);

      return res.status(200).json({ status: "success", message: "Appointments fetched", data: { total, appointments } });
    } catch (err) {
      logger.error(`GetAllAppointments (admin): ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch appointments" });
    }
  }

  async getAllPayments(req, res) {
    try {
      const { status, skip = 0, limit = 20 } = req.query;
      const filter = {};
      if (status) filter.status = status;

      const [payments, total] = await Promise.all([
        Payment.find(filter)
          .populate("patient", "name email")
          .populate({ path: "doctor", populate: { path: "user", select: "name" } })
          .populate("appointment", "appointmentDate timeSlot status")
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .select("-__v"),
        Payment.countDocuments(filter),
      ]);

      return res.status(200).json({ status: "success", message: "Payments fetched", data: { total, payments } });
    } catch (err) {
      logger.error(`GetAllPayments (admin): ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch payments" });
    }
  }
}

export default new AdminService();
