import authService from "./auth.service.js";

class AuthController {
  async register(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Register a new patient or doctor account' */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/Register" }
       } */
    return authService.register(req, res);
  }

  async login(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Login with email and password to receive a JWT token' */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/Login" }
       } */
    return authService.login(req, res);
  }

  async getMe(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Get the currently logged-in user profile' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return authService.getMe(req, res);
  }

  async updateMe(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Update logged-in user basic profile (name, phone, location)' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    return authService.updateMe(req, res);
  }

  async doctorRegister(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Submit a doctor registration application (multipart/form-data)' */
    return authService.doctorRegister(req, res);
  }

  async changePassword(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Change the logged-in user password' */
    /* #swagger.security = [{ "AccessToken": [] }] */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { $ref: "#/definitions/ChangePassword" }
       } */
    return authService.changePassword(req, res);
  }

  async forgotPassword(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Request a password reset link sent to the registered email' */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { email: 'user@example.com' }
       } */
    return authService.forgotPassword(req, res);
  }

  async resetPassword(req, res) {
    /* #swagger.tags = ['Auth']
       #swagger.description = 'Reset password using the token from the email link' */
    /* #swagger.parameters['token'] = { in: 'path', required: true, type: 'string' } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         schema: { newPassword: 'newPassword123' }
       } */
    return authService.resetPassword(req, res);
  }
}

export default new AuthController();
