class Response {
    userSuccessResp(message, projectDetails) {
      return {
        statusCode: 200,
        body: {
          status: "success",
          message: message,
          data: projectDetails,
        },
      };
    }
  
    userFailResp(msg, err) {
      return {
        statusCode: 400,
        body: {
          status: "failed",
          message: msg,
          error: err,
        },
      };
    }

  }
  
  export default new Response();
  