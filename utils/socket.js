import { Server } from "socket.io";
import logger from "./logger.js";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined room user:${userId}`);
      }
    });
    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function safeEmit(room, event, data) {
  try {
    getIO().to(room).emit(event, data);
  } catch (_) {}
}
