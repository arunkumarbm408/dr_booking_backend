import appointmentService from "./appointment.service.js";

class AppointmentController {
  async bookAppointment(req, res) {
    /* #swagger.tags = ['Appointment']
       #swagger.description = 'Book an appointment with an approved doctor (patient only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/BookAppointment" }
       } */
    return appointmentService.bookAppointment(req, res);
  }

  async getMyAppointments(req, res) {
    /* #swagger.tags = ['Appointment']
       #swagger.description = 'Get all appointments for the logged-in patient' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return appointmentService.getMyAppointments(req, res);
  }

  async getAppointmentById(req, res) {
    /* #swagger.tags = ['Appointment']
       #swagger.description = 'Get appointment details by ID (accessible by patient, doctor, or admin)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return appointmentService.getAppointmentById(req, res);
  }

  async cancelAppointment(req, res) {
    /* #swagger.tags = ['Appointment']
       #swagger.description = 'Cancel a pending or approved appointment (patient only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return appointmentService.cancelAppointment(req, res);
  }
}

export default new AppointmentController();
