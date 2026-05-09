import express from "express";
import authorAPIController from "./author.controller.js";
const router = express.Router();

//Routes for author
router.post("/create", authorAPIController.createAuthor);
router.get("/get", authorAPIController.getAuthors);

export default router;