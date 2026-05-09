import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().allow("").optional(),
  location: Joi.string().trim().allow("").optional(),
});

export const doctorRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().allow("").optional(),
  specialization: Joi.string().trim().required(),
  experience: Joi.number().min(0).required(),
  fees: Joi.number().min(0).optional(),
  qualifications: Joi.string().trim().allow("").optional(),
  clinicName: Joi.string().trim().allow("").optional(),
  location: Joi.string().trim().allow("").optional(),
  licenseNumber: Joi.string().trim().allow("").optional(),
  about: Joi.string().trim().allow("").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});
