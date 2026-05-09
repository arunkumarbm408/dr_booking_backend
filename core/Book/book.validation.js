import Joi from "joi";

export const bookSchema = Joi.object({
  name: Joi.string().trim().required(),
  author: Joi.string().required(),  
  source: Joi.string().optional(),
  publishedAt: Joi.date().required(),
  ratings: Joi.number().min(1).max(5).optional()
});

export const updateBookSchema = Joi.object({
  name: Joi.string().trim(),
  author: Joi.string(),  
  source: Joi.string().optional(),
  publishedAt: Joi.date(),
  ratings: Joi.number().min(1).max(5).optional()
});
