import mongoose from "mongoose";

import logger from "./logger.js";
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.mongodb_uri
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
