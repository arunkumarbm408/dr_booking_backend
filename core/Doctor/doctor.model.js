import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maxPatients: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: { type: String, required: true, trim: true },
    experience: { type: Number, required: true, min: 0 },
    fees: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    about: { type: String, default: "" },
    qualifications: { type: [String], default: [] },
    availabilitySlots: { type: [slotSchema], default: [] },
    profileImage: { type: String, default: "" },
    documents: { type: [String], default: [] },
    clinicName: { type: String, default: "", trim: true },
    licenseNumber: { type: String, default: "", trim: true },
    isApproved: { type: Boolean, default: process.env.AUTO_APPROVE_DOCTORS === "true" },
    rejectionReason: { type: String, default: "" },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Info Requested"],
      default: "Pending",
    },
    verificationHistory: [
      {
        action: { type: String, required: true },
        byName: { type: String, default: "" },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
        _id: false,
      },
    ],
    emailLog: [
      {
        type: {
          type: String,
          enum: ["applicationReceived", "approved", "rejected", "infoRequested"],
          required: true,
        },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["sent", "failed"], default: "sent" },
        messageId: { type: String, default: "" },
        _id: false,
      },
    ],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
