import Joi from "joi";

export const bookAppointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  appointmentDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ "string.pattern.base": "appointmentDate must be in YYYY-MM-DD format" }),
  timeSlot: Joi.string().required(),
  symptoms: Joi.string().allow("").optional(),
  paymentMethod: Joi.string().default("Pay at clinic"),
});

export const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().allow("").optional(),
});
