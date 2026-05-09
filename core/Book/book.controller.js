import bookAPIService from "./book.service.js";

class bookAPIController {
  async createbook(req, res) {
    /* #swagger.tags = ['Book']
                           #swagger.description = 'This routes is used for create new book' */
    /*	#swagger.parameters['data'] = {
                                in: 'body',
                                description: 'create new book',
                                required: true,
                                schema: { $ref: "#/definitions/BookAdd" }
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
    return await bookAPIService.createBook(req, res);
  }

  async getAllBooks(req, res) {
    /*  #swagger.tags = ['Book']
    #swagger.description = 'Fetch all books with pagination'

    #swagger.parameters['skip'] = {
        in: 'query',
        description: 'Number of records to skip',
        required: false,
        type: 'integer',
        example: 0
    }

    #swagger.parameters['limit'] = {
        in: 'query',
        description: 'Number of records to return',
        required: false,
        type: 'integer',
        example: 10
    }

    #swagger.responses[200] = {
        description: 'Books fetched successfully'
    }
    #swagger.responses[400] = {
        description: 'Bad Request'
    }
    #swagger.responses[404] = {
        description: 'Not Found'
    }
    #swagger.responses[500] = {
        description: 'Internal Server Error'
    }
*/
    return await bookAPIService.getAllBooks(req, res);
  }
  async searchByAuthorName(req, res) {
    /*  #swagger.tags = ['Book']
    #swagger.description = 'This route is used to fetch book details'

    #swagger.parameters['authorName'] = {
        in: 'query',
        description: 'Filter books by author name',
        required: true,
        type: 'string',
        example: 'Harry Potter'
    }

    #swagger.responses[200] = {
        description: 'Success'
    }
    #swagger.responses[400] = {
        description: 'Bad Request'
    }
    #swagger.responses[404] = {
        description: 'Not Found'
    }
    #swagger.responses[500] = {
        description: 'Internal Server Error'
    }
*/

    return await bookAPIService.searchByAuthorName(req, res);
  }

  async updateBookByID(req, res) {
    /*  #swagger.tags = ['Book']
    #swagger.description = 'This route is used to update book details by ID'

    #swagger.parameters['id'] = {
        in: 'path',
        required: true,
        description: 'Book ID',
        type: 'string',
        example: '6715e5a4c3b87d4b82e334a9'
    }

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        description: 'Fields to update',
        schema: {
            $name: "New Book Name",
            $source: "Updated Source",
            $ratings: 4
        }
    }

    #swagger.responses[200] = {
        description: 'Success'
    }
    #swagger.responses[400] = {
        description: 'Bad Request'
    }
    #swagger.responses[404] = {
        description: 'Book Not Found'
    }
    #swagger.responses[500] = {
        description: 'Internal Server Error'
    }
*/

    return await bookAPIService.updateBookByID(req, res);
  }

  async deleteBookByID(req, res) {
    /*  #swagger.tags = ['Book']
    #swagger.description = 'This route is used to delete a book by ID'

    #swagger.parameters['id'] = {
        in: 'path',
        required: true,
        description: 'Book ID',
        type: 'string',
        example: '6715e5a4c3b87d4b82e334a9'
    }

    #swagger.responses[200] = {
        description: 'Book deleted successfully'
    }
    #swagger.responses[400] = {
        description: 'Bad Request'
    }
    #swagger.responses[404] = {
        description: 'Book Not Found'
    }
    #swagger.responses[500] = {
        description: 'Internal Server Error'
    }
*/
    return await bookAPIService.deleteBookByID(req, res);
  }
}

export default new bookAPIController();