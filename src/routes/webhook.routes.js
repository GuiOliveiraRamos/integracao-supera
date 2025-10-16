/**
 * Rotas para webhooks
 */
import express from "express";
import {
  handleGoogleFormsWebhook,
  handleTestWebhook,
  handleHealthCheck,
} from "../controllers/webhook.controller.js";
import {
  validateFormData,
  logRequestData,
} from "../middlewares/validation.middleware.js";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";

const router = express.Router();

// Rota de health check
router.get("/", handleHealthCheck);

// Rota do webhook do Google Forms (com validação)
router.post(
  "/webhook/google-forms",
  logRequestData,
  validateFormData,
  asyncHandler(handleGoogleFormsWebhook)
);

// Rota de teste (sem validação, pois usa dados mock)
router.post("/test-webhook", asyncHandler(handleTestWebhook));

export default router;
