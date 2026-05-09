import express from "express";
import bookAPIController from "./book.controller.js";
const router = express.Router();

//Routes for book
router.post("/create", bookAPIController.createbook);
router.get("/list", bookAPIController.getAllBooks);
router.get("/search", bookAPIController.searchByAuthorName);
router.put("/update/:id", bookAPIController.updateBookByID);
router.delete("/delete/:id", bookAPIController.deleteBookByID);

export default router;