import express from "express";
import v1 from "./v1/main.routes.js";

const router = express.Router();

// API versioning
router.use("/v1", v1);

export default router;
