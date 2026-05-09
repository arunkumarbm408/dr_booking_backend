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
    isApproved: { type: Boolean, default: process.env.AUTO_APPROVE_DOCTORS === "true" },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
