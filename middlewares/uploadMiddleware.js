import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import AppError from "../utils/appError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /\.(jpeg|jpg|png|pdf)$/i;
  if (allowed.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPEG, JPG, PNG, and PDF files are allowed.", 400), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 };

export const uploadProfileImage = multer({ storage, fileFilter, limits }).single("profileImage");
export const uploadDocuments = multer({ storage, fileFilter, limits }).array("documents", 5);
export const uploadPaymentScreenshot = multer({ storage, fileFilter, limits }).single("screenshot");
export const uploadDoctorRegistration = multer({ storage, fileFilter, limits }).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);
