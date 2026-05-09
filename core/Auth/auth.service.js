import logger from "../../utils/logger.js";
import User from "../User/user.model.js";
import { generateToken } from "../../utils/generateToken.js";
import { registerSchema, loginSchema, changePasswordSchema } from "./auth.validation.js";

class AuthService {
  async register(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

      const existing = await User.findOne({ email: value.email });
      if (existing) {
        return res.status(400).json({ status: "fail", message: "Email is already registered" });
      }

      const user = await User.create(value);
      const token = generateToken(user._id, user.role);

      return res.status(201).json({
        status: "success",
        message: "Registration successful",
        data: {
          token,
          user: { id: user._id, name: user.name, email: user.email, role: user.role },
        },
      });
    } catch (err) {
      logger.error(`Register: ${err}`);
      return res.status(500).json({ status: "error", message: "Registration failed" });
    }
  }

  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
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
        data: {
          token,
          user: { id: user._id, name: user.name, email: user.email, role: user.role },
        },
      });
    } catch (err) {
      logger.error(`Login: ${err}`);
      return res.status(500).json({ status: "error", message: "Login failed" });
    }
  }

  async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id);
      return res.status(200).json({ status: "success", message: "Profile fetched", data: user });
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
      if (error) {
        return res.status(400).json({ status: "fail", message: error.message });
      }

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
}

export default new AuthService();
