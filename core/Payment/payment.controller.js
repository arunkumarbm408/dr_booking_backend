import paymentService from "./payment.service.js";

class PaymentController {
  async createPayment(req, res) {
    /* #swagger.tags = ['Payment']
       #swagger.description = 'Submit a payment record for an appointment (patient only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/CreatePayment" }
       } */
    return paymentService.createPayment(req, res);
  }

  async uploadScreenshot(req, res) {
    /* #swagger.tags = ['Payment']
       #swagger.description = 'Upload payment screenshot (multipart/form-data, field: screenshot)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return paymentService.uploadScreenshot(req, res);
  }

  async getMyPayments(req, res) {
    /* #swagger.tags = ['Payment']
       #swagger.description = 'Get all payment records for the logged-in patient' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return paymentService.getMyPayments(req, res);
  }

  async getDoctorPayments(req, res) {
    /* #swagger.tags = ['Payment']
       #swagger.description = 'Get all payments received by the logged-in doctor' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return paymentService.getDoctorPayments(req, res);
  }

  async updatePaymentStatus(req, res) {
    /* #swagger.tags = ['Payment']
       #swagger.description = 'Approve or reject a payment (admin or doctor)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/UpdatePaymentStatus" }
       } */
    return paymentService.updatePaymentStatus(req, res);
  }

  async getPaymentById(req, res) {
    /* #swagger.tags = ['Payment']
       #swagger.description = 'Get payment details by ID' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return paymentService.getPaymentById(req, res);
  }
}

export default new PaymentController();
