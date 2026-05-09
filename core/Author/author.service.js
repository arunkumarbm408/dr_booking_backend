import Response from "../../utils/response.js";
import logger from "../../utils/logger.js";
import Author from "./author.model.js";
import { authorSchema } from "./author.validation.js";

class authorAPIService {
  async createAuthor(req, res) {
    try {
      const { error, value } = authorSchema.validate(req.body);
      if (error)
        return res.send(
          Response.userFailResp("validation error", error.message)
        );
      const existingAuthor = await Author.findOne({ name: value.name });

      if (existingAuthor) {
        return res.send(
          Response.userFailResp("Author already exists", "Duplicate entry")
        );
      }
      const author = await Author.create(value);
      return res.send(
        Response.userSuccessResp("Author created successfully!", author)
      );
    } catch (error) {
      console.error(error);
      logger.error(`${error}`);
      return res.send(
        Response.userFailResp("Failed to create the author", error)
      );
    }
  }

  async getAuthors(req, res) {
    try {
      const authors = await Author.find()
        .select("-__v")
        .populate("booksByAuthor", "-author -_id -__v");
      return res.send(
        Response.userSuccessResp("Authors fetched successfully!", authors)
      );
    } catch (error) {
      console.error(error);
      logger.error(`${error}`);
      return res.send(
        Response.userFailResp("Failed to fetch the authors", error)
      );
    }
  }
}
export default new authorAPIService();
