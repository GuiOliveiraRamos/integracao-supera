// Handler serverless para Vercel
import app from "../src/server.js";
import serverless from "serverless-http";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default serverless(app);
