import doctorService from "./doctor.service.js";

class DoctorController {
  async createProfile(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Create doctor profile (requires doctor role)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/CreateDoctorProfile" }
       } */
    return doctorService.createProfile(req, res);
  }

  async getMyProfile(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Get logged-in doctor own profile' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return doctorService.getMyProfile(req, res);
  }

  async updateMyProfile(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Update logged-in doctor profile details' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         schema: { $ref: "#/definitions/UpdateDoctorProfile" }
       } */
    return doctorService.updateMyProfile(req, res);
  }

  async setAvailability(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Set or replace doctor availability time slots' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/AvailabilitySlots" }
       } */
    return doctorService.setAvailability(req, res);
  }

  async uploadProfileImage(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Upload doctor profile image (multipart/form-data, field: profileImage)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return doctorService.uploadProfileImage(req, res);
  }

  async uploadDocuments(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Upload doctor credential documents (multipart/form-data, field: documents, max 5 files)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return doctorService.uploadDocuments(req, res);
  }

  async getDoctors(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Get all approved doctors with optional filters (specialization, location, search, skip, limit)' */
    return doctorService.getDoctors(req, res);
  }

  async getDoctorById(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Get a single doctor by ID' */
    return doctorService.getDoctorById(req, res);
  }

  async getMyAppointments(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Get all appointments for the logged-in doctor' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return doctorService.getMyAppointments(req, res);
  }

  async updateAppointmentStatus(req, res) {
    /* #swagger.tags = ['Doctor']
       #swagger.description = 'Approve, reject, or mark appointment as completed' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/UpdateAppointmentStatus" }
       } */
    return doctorService.updateAppointmentStatus(req, res);
  }
}

export default new DoctorController();
