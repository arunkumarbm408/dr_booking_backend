import logger from "../../utils/logger.js";
import User from "../User/user.model.js";
import Doctor from "../Doctor/doctor.model.js";
import { generateToken } from "../../utils/generateToken.js";
import crypto from "crypto";
import { registerSchema, doctorRegisterSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validation.js";
import { sendEmail, emailTemplates } from "../../utils/email.js";

class AuthService {
  async register(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body, { stripUnknown: true });
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const existing = await User.findOne({ email: value.email });
      if (existing) return res.status(400).json({ status: "fail", message: "Email is already registered" });

      const user = await User.create({ ...value, role: "patient" });
      const token = generateToken(user._id, user.role);

      return res.status(201).json({
        status: "success",
        message: "Registration successful",
        data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      });
    } catch (err) {
      logger.error(`Register: ${err}`);
      return res.status(500).json({ status: "error", message: "Registration failed" });
    }
  }

  async doctorRegister(req, res) {
    try {
      let body = { ...req.body };
      if (body.experience !== undefined) body.experience = Number(body.experience);
      if (body.fees !== undefined) body.fees = Number(body.fees);

      const { error, value } = doctorRegisterSchema.validate(body, { stripUnknown: true });
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const existing = await User.findOne({ email: value.email });
      if (existing) return res.status(400).json({ status: "fail", message: "Email is already registered" });

      const user = await User.create({
        name: value.name,
        email: value.email,
        password: value.password,
        phone: value.phone || "",
        role: "doctor",
      });

      const profileImage = req.files?.profileImage?.[0]
        ? `/uploads/${req.files.profileImage[0].filename}`
        : "";
      const documents = (req.files?.documents || []).map((f) => `/uploads/${f.filename}`);
      const qualifications = value.qualifications
        ? value.qualifications.split(",").map((q) => q.trim()).filter(Boolean)
        : [];

      const doctor = await Doctor.create({
        user: user._id,
        specialization: value.specialization,
        experience: value.experience,
        fees: value.fees || 0,
        location: value.location || "",
        about: value.about || "",
        clinicName: value.clinicName || "",
        licenseNumber: value.licenseNumber || "",
        qualifications,
        profileImage,
        documents,
        isApproved: false,
        verificationStatus: "Pending",
      });

      const emailResult = await sendEmail({
        to: user.email,
        subject: "Doctor Application Received — Doctor Book",
        html: emailTemplates.applicationReceived(user.name),
      });

      await Doctor.findByIdAndUpdate(doctor._id, {
        $push: {
          emailLog: {
            type: "applicationReceived",
            sentAt: new Date(),
            status: emailResult.success ? "sent" : "failed",
            messageId: emailResult.messageId || "",
          },
        },
      });

      return res.status(201).json({
        status: "success",
        message: "Application submitted. You will receive an email once your account is approved by admin.",
      });
    } catch (err) {
      logger.error(`DoctorRegister: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to submit doctor application" });
    }
  }

  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      if (value.email === process.env.ADMIN_EMAIL && value.password === process.env.ADMIN_PASSWORD) {
        const token = generateToken("admin", "admin");
        return res.status(200).json({
          status: "success",
          message: "Admin login successful",
          data: {
            token,
            user: { id: "admin", name: process.env.ADMIN_NAME || "Admin", email: process.env.ADMIN_EMAIL, role: "admin" },
          },
        });
      }

      const user = await User.findOne({ email: value.email }).select("+password");
      if (!user || !(await user.comparePassword(value.password))) {
        return res.status(401).json({ status: "fail", message: "Invalid email or password" });
      }
      if (!user.isActive) {
        return res.status(403).json({ status: "fail", message: "Account is deactivated. Contact support." });
      }

      const token = generateToken(user._id, user.role);
      return res.status(200).json({
        status: "success",
        message: "Login successful",
        data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      });
    } catch (err) {
      logger.error(`Login: ${err}`);
      return res.status(500).json({ status: "error", message: "Login failed" });
    }
  }

  async getMe(req, res) {
    try {
      if (req.user.role === "admin") {
        return res.status(200).json({
          status: "success",
          message: "Profile fetched",
          data: {
            user: { id: "admin", name: process.env.ADMIN_NAME || "Admin", email: process.env.ADMIN_EMAIL, role: "admin" },
            doctorProfile: null,
          },
        });
      }

      const user = await User.findById(req.user._id);
      let doctorProfile = null;
      if (user.role === "doctor") {
        doctorProfile = await Doctor.findOne({ user: user._id });
      }

      return res.status(200).json({ status: "success", message: "Profile fetched", data: { user, doctorProfile } });
    } catch (err) {
      logger.error(`GetMe: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to fetch profile" });
    }
  }

  async updateMe(req, res) {
    try {
      const allowed = ["name", "phone", "location"];
      const updates = {};
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      return res.status(200).json({ status: "success", message: "Profile updated", data: user });
    } catch (err) {
      logger.error(`UpdateMe: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to update profile" });
    }
  }

  async changePassword(req, res) {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const user = await User.findById(req.user._id).select("+password");
      if (!(await user.comparePassword(value.currentPassword))) {
        return res.status(401).json({ status: "fail", message: "Current password is incorrect" });
      }
      user.password = value.newPassword;
      await user.save();
      return res.status(200).json({ status: "success", message: "Password changed successfully" });
    } catch (err) {
      logger.error(`ChangePassword: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to change password" });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const user = await User.findOne({ email: value.email });
      // Always return success to avoid email enumeration
      if (!user) {
        return res.status(200).json({ status: "success", message: "If that email is registered, a reset link has been sent." });
      }

      const rawToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
      const emailResult = await sendEmail({
        to: user.email,
        subject: "Password Reset Request — Doctor Book",
        html: emailTemplates.forgotPassword(user.name, resetUrl),
      });

      if (!emailResult.success) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        logger.error(`ForgotPassword email failed for ${user.email}`);
        return res.status(500).json({ status: "error", message: "Failed to send reset email. Please try again." });
      }

      return res.status(200).json({ status: "success", message: "If that email is registered, a reset link has been sent." });
    } catch (err) {
      logger.error(`ForgotPassword: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to process request" });
    }
  }

  async resetPassword(req, res) {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) return res.status(400).json({ status: "fail", message: error.message });

      const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      }).select("+passwordResetToken +passwordResetExpires");

      if (!user) {
        return res.status(400).json({ status: "fail", message: "Reset link is invalid or has expired." });
      }

      user.password = value.newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(200).json({ status: "success", message: "Password has been reset. You can now log in." });
    } catch (err) {
      logger.error(`ResetPassword: ${err}`);
      return res.status(500).json({ status: "error", message: "Failed to reset password" });
    }
  }
}

export default new AuthService();
