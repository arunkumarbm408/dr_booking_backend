import express from "express";
import authController from "./auth.controller.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe);
router.put("/me", protect, authController.updateMe);
router.put("/change-password", protect, authController.changePassword);

export default router;
