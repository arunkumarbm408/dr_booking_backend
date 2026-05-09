import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    booksByAuthor: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Book",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Author", AuthorSchema);