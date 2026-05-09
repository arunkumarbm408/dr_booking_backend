import Joi from "joi";

const slotSchema = Joi.object({
  day: Joi.string()
    .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    .required(),
  startTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required()
    .messages({ "string.pattern.base": "startTime must be in HH:MM format" }),
  endTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required()
    .messages({ "string.pattern.base": "endTime must be in HH:MM format" }),
  maxPatients: Joi.number().min(1).default(1),
});

export const createDoctorProfileSchema = Joi.object({
  specialization: Joi.string().trim().required(),
  experience: Joi.number().min(0).required(),
  fees: Joi.number().min(0).required(),
  location: Joi.string().trim().required(),
  about: Joi.string().allow("").optional(),
  qualifications: Joi.array().items(Joi.string().trim()).optional(),
});

export const updateDoctorProfileSchema = Joi.object({
  specialization: Joi.string().trim().optional(),
  experience: Joi.number().min(0).optional(),
  fees: Joi.number().min(0).optional(),
  location: Joi.string().trim().optional(),
  about: Joi.string().allow("").optional(),
  qualifications: Joi.array().items(Joi.string().trim()).optional(),
  availabilitySlots: Joi.array().items(slotSchema).optional(),
});

export const availabilitySlotsSchema = Joi.object({
  slots: Joi.array().items(slotSchema).min(1).required(),
});

export const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected", "Completed").required(),
  notes: Joi.string().allow("").optional(),
});
