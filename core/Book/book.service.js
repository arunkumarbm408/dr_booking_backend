import Response from "../../utils/response.js";
import logger from "../../utils/logger.js";
import Book from "./book.model.js";
import { bookSchema, updateBookSchema } from "./book.validation.js";
import Author from "../Author/author.model.js";

class bookAPIService {
  async createBook(req, res) {
    try {
      const { error, value } = bookSchema.validate(req.body);
      if (error)
        return res.send(Response.userFailResp("validation error", error));
      const exists = await Author.findOne({ name: value?.author });
      if (!exists) return res.send(Response.userFailResp("Author not found"));
      const isExist = await Book.findOne({
        name: value.name,
        author: exists._id,
      });

      if (isExist)
        return res.send(
          Response.userFailResp("Book already exists for this author")
        );
      const book = await Book.create({ ...value, author: exists._id });
      await Author.findByIdAndUpdate(exists._id, {
        $addToSet: { booksByAuthor: book._id },
      });
      return res.send(
        Response.userSuccessResp("Book created successfully!", book)
      );
    } catch (error) {
      console.error(error);
      logger.error(`${error}`);
      return res.send(
        Response.userFailResp("Failed to create the book", error)
      );
    }
  }

  async getAllBooks(req, res) {
    try {
      let { skip = 0, limit = 10 } = req.query;
      skip = parseInt(skip);
      limit = parseInt(limit);

      const books = await Book.find()
        .select("-__v")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("author", "name -_id");

      const totalBooks = await Book.countDocuments();
      return res.send(
        Response.userSuccessResp("Books fetched successfully!", {
          totalBooks,
          books,
        })
      );
    } catch (error) {
      console.error(error);
      logger.error(`${error}`);
      return res.send(
        Response.userFailResp("Failed to fetch the books", error)
      );
    }
  }

  async searchByAuthorName(req, res) {
    try {
      const { authorName } = req.query;
      if (!authorName) {
        return res.send(Response.userFailResp("authorName is required"));
      }

      const authors = await Author.find(
        { name: { $regex: authorName, $options: "i" } },
        { _id: 1 }
      ).lean();

      if (!authors?.length) {
        return res.send(Response.userFailResp("No books found", []));
      }

      const authorIds = authors?.map((a) => a._id);
      const books = await Book.find({ author: { $in: authorIds } })
        .select("-__v")
        .sort({ createdAt: -1 })
        .lean();
      if (!books.length)
        return res.send(
          Response.userFailResp("No books found for this author")
        );
      return res.send(
        Response.userSuccessResp("Books fetched successfully!", books)
      );
    } catch (error) {
      console.error(error);
      logger.error(`${error}`);
      return res.send(
        Response.userFailResp("Failed to fetch the books", error)
      );
    }
  }

  async updateBookByID(req, res) {
    try {
      const { error, value } = updateBookSchema.validate(req.body);
      if (error)
        return res.send(Response.userFailResp("validation error", error));

      if (value.author) {
        const exists = await Author.findById(value.author);
        if (!exists) return res.send(Response.userFailResp("Author not found"));
      }
      const book = await Book.findByIdAndUpdate(req.params.id, value, {
        new: true,
      }).populate("author");
      if (!book)
        return res.send(Response.userFailResp("Book not found to update"));
      return res.send(Response.userSuccessResp("Book updated successfully!"));
    } catch (error) {
      console.error(error);
      logger.error(`${error}`);
      return res.send(
        Response.userFailResp("Failed to update the book", error)
      );
    }
  }

  async deleteBookByID(req, res) {
    try {
      const bookId = req.params.id;
      if (!bookId)
        return res.send(Response.userFailResp("Please provide the book id"));
      const book = await Book.findByIdAndDelete(bookId);
      if (!book)
        return res.send(Response.userFailResp("Book not found to delete"));
      return res.send(Response.userSuccessResp("Book deleted successfully!"));
    } catch (error) {
      console.error(error);
      logger.error(`${error}`);
      return res.send(
        Response.userFailResp("Failed to delete the book", error)
      );
    }
  }
}
export default new bookAPIService();