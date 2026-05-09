import Joi from "joi";

export const createPaymentSchema = Joi.object({
  appointmentId: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  method: Joi.string().default("PhonePe"),
  utrId: Joi.string().trim().allow("").optional(),
});

export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected").required(),
  adminNote: Joi.string().allow("").optional(),
});
