import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentDate: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
    },
    symptoms: { type: String, default: "" },
    notes: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    paymentMethod: { type: String, default: "Pay at clinic" },
    cancelledAt: { type: Date },
    refundEligible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
