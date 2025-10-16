/**
 * Agregador de todas as rotas da aplicação
 */
import express from "express";
import webhookRoutes from "./webhook.routes.js";

const router = express.Router();

// Registrar rotas de webhook
router.use("/", webhookRoutes);

export default router;
