import basicAuth from "express-basic-auth";
import dotenv from 'dotenv';
dotenv.config();

const auth = basicAuth({
  users: {[process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD},
  challenge: true,
});

export { auth };
