import swaggerAutogen from "swagger-autogen";
const swagger = swaggerAutogen();
import dotenv from "dotenv";
dotenv.config();

const doc = {
  info: {
    app_version: process.env.app_version ?? "1.0.0",
    title: "Doctor Booking API",
    description: "Complete REST API for the Doctor Appointment Booking System. Supports patient registration, doctor profiles, appointment booking, availability management, and payment tracking.",
  },
  host: process.env.swagger_host_url || "localhost:5001",
  basePath: "/",
  schemes: ["https", "http"],
  consumes: ["application/json", "application/x-www-form-urlencoded"],
  produces: ["application/json"],
  tags: [
    { name: "Auth", description: "User registration and authentication" },
    { name: "Doctor", description: "Doctor profile, availability, and appointment management" },
    { name: "Appointment", description: "Patient appointment booking and management" },
    { name: "Payment", description: "Payment submission and status tracking" },
    { name: "Admin", description: "Admin dashboard and system management" },
  ],
  securityDefinitions: {
    AccessToken: {
      type: "apiKey",
      in: "header",
      name: "authorization",
      description: "Provide the Bearer token: 'Bearer <your_jwt_token>'",
    },
  },
  definitions: {
    Register: {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "patient",
      phone: "9876543210",
      location: "Chennai",
    },
    Login: {
      email: "john@example.com",
      password: "password123",
    },
    ChangePassword: {
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
    },
    CreateDoctorProfile: {
      specialization: "Cardiology",
      experience: 10,
      fees: 500,
      location: "Chennai",
      about: "Experienced cardiologist with 10+ years of practice.",
      qualifications: ["MBBS", "MD - Cardiology"],
    },
    UpdateDoctorProfile: {
      specialization: "Cardiology",
      experience: 12,
      fees: 600,
      location: "Bangalore",
      about: "Updated about section.",
    },
    AvailabilitySlots: {
      slots: [
        { day: "Monday", startTime: "09:00", endTime: "17:00", maxPatients: 10 },
        { day: "Wednesday", startTime: "09:00", endTime: "13:00", maxPatients: 5 },
        { day: "Friday", startTime: "14:00", endTime: "18:00", maxPatients: 8 },
      ],
    },
    BookAppointment: {
      doctorId: "60d5f484f1a2c8b1a4e4e4e4",
      appointmentDate: "2026-05-15",
      timeSlot: "10:00 - 10:30",
      symptoms: "Chest pain and shortness of breath",
      paymentMethod: "Pay at clinic",
    },
    UpdateAppointmentStatus: {
      status: "Approved",
      notes: "Please bring previous reports.",
    },
    CreatePayment: {
      appointmentId: "60d5f484f1a2c8b1a4e4e4e4",
      amount: 500,
      method: "PhonePe",
      utrId: "UTR1234567890",
    },
    UpdatePaymentStatus: {
      status: "Approved",
      adminNote: "Payment verified via UTR ID.",
    },
    ApproveDoctorProfile: {
      isApproved: true,
    },
  },
};

const outputFile = "./views/swagger-api-view.json";
const endpointsFiles = ["./server.js"];

await swagger(outputFile, endpointsFiles, doc);
