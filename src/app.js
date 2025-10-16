/**
 * Aplicação principal - Servidor de integração Supera Parque
 * Arquitetura em camadas: Controllers, Services, Routes, Middlewares, Utils e Schemas
 */
import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.middleware.js";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json());

// Registrar todas as rotas
app.use("/", routes);

// Handlers de erro (devem vir após todas as rotas)
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(
    `🚀 Servidor de integração Supera Parque rodando na porta ${PORT}`
  );
  console.log(`\nEndpoints disponíveis:`);
  console.log(`  GET  / - Status do servidor`);
  console.log(`  POST /webhook/google-forms - Webhook do Google Forms`);
  console.log(`  POST /test-webhook - Teste local`);
  console.log(`\nAmbiente: ${process.env.NODE_ENV || "development"}`);
});
