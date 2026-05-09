import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import User from "../core/User/user.model.js";
import Doctor from "../core/Doctor/doctor.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Not authorized. No token provided.", 401));
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Admin is env-only — bypass DB lookup
  if (decoded.id === "admin" && decoded.role === "admin") {
    req.user = {
      _id: "admin",
      id: "admin",
      name: process.env.ADMIN_NAME || "Admin",
      email: process.env.ADMIN_EMAIL,
      role: "admin",
      isActive: true,
    };
    return next();
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) return next(new AppError("User no longer exists.", 401));
  if (!user.isActive) return next(new AppError("Account is deactivated.", 403));

  req.user = user;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
};

export const requireApprovedDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).select("isApproved");
  if (!doctor?.isApproved) {
    return next(new AppError("Your doctor profile is pending admin approval.", 403));
  }
  next();
});
