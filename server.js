import http from "http";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();


import xssSanitizer from "./middlewares/xssSanitizer.js";
import globalErrorHandler from "./middlewares/errorMiddleware.js";
import routes from "./routes/index.js";
import { connectDB } from "./utils/database.js";
import logger from "./utils/logger.js";
import { auth} from "./views/swaggerAuth.js";
import { initSocket } from "./utils/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerFile = JSON.parse(
  fs.readFileSync("./views/swagger-api-view.json", "utf-8")
);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT


if (process.env.NODE_ENV === "localDev") {
  app.use(morgan("dev"));
}

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xssSanitizer);
app.use(cors({ origin: "*" }));
app.options("*", cors()); 

const limiter = rateLimit({
  max: 10000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.use(compression());
app.use(express.static(path.join(__dirname, "public")));

// STATIC FILES
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API ROUTES
app.get("/", (_req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the Doctor Booking API",
    docs: "/api-doc",
    version: process.env.app_version || "1.0.0",
  });
});
app.use("/api", routes);

app.use(
  "/api-doc",
  auth,
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile)
);

// GLOBAL ERROR HANDLER

app.use(globalErrorHandler);

// START SERVER
const startServer = async () => {
  try {
    await connectDB();
    initSocket(httpServer);
    httpServer.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.log(error)
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle unhandled promise rejections and uncaught exceptions
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

startServer();
