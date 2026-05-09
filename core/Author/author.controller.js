import authorAPIService from "./author.service.js";

class authorAPIController {
  async createAuthor(req, res) {
    /* #swagger.tags = ['Author']
                           #swagger.description = 'This routes is used for create new Author' */
    /*	#swagger.parameters['data'] = {
                                in: 'body',
                                description: 'create new author',
                                required: true,
                                schema: { $ref: "#/definitions/AuthorCreate" }
                        } */
    /* #swagger.responses[200] = {
            description: 'Success'
          } */
    /* #swagger.responses[400] = {
            description: 'Bad Request'
          } */
    /* #swagger.responses[404] = {
            description: 'Not Found'
          } */
    /* #swagger.responses[500] = {
            description: 'Internal Server Error'
          } */

    return await authorAPIService.createAuthor(req, res);
  }

  async getAuthors(req, res) {
    /* #swagger.tags = ['Author']
                           #swagger.description = 'This routes is used for fetch the Author details' */

    /* #swagger.responses[200] = {
            description: 'Success'
          } */
    /* #swagger.responses[400] = {
            description: 'Bad Request'
          } */
    /* #swagger.responses[404] = {
            description: 'Not Found'
          } */
    /* #swagger.responses[500] = {
            description: 'Internal Server Error'
          } */
    return await authorAPIService.getAuthors(req, res);
  }
}

export default new authorAPIController();
