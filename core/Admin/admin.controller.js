import adminService from "./admin.service.js";

class AdminController {
  async getDashboard(req, res) {
    /* #swagger.tags = ['Admin']
       #swagger.description = 'Get system-wide statistics (admin only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return adminService.getDashboard(req, res);
  }

  async getAllUsers(req, res) {
    /* #swagger.tags = ['Admin']
       #swagger.description = 'List all users with optional role filter (admin only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return adminService.getAllUsers(req, res);
  }

  async toggleUserStatus(req, res) {
    /* #swagger.tags = ['Admin']
       #swagger.description = 'Activate or deactivate a user account (admin only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return adminService.toggleUserStatus(req, res);
  }

  async getAllDoctors(req, res) {
    /* #swagger.tags = ['Admin']
       #swagger.description = 'List all doctors with optional isApproved filter (admin only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return adminService.getAllDoctors(req, res);
  }

  async approveDoctorProfile(req, res) {
    /* #swagger.tags = ['Admin']
       #swagger.description = 'Approve or reject a doctor profile by ID (admin only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/ApproveDoctorProfile" }
       } */
    return adminService.approveDoctorProfile(req, res);
  }

  async getAllAppointments(req, res) {
    /* #swagger.tags = ['Admin']
       #swagger.description = 'List all appointments with optional status filter (admin only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return adminService.getAllAppointments(req, res);
  }

  async getAllPayments(req, res) {
    /* #swagger.tags = ['Admin']
       #swagger.description = 'List all payments with optional status filter (admin only)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return adminService.getAllPayments(req, res);
  }
}

export default new AdminController();
