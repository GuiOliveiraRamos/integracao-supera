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
router.get("/", (req, res, next) => {
  console.log('[ROUTE] GET / healthcheck', { requestId: req.requestId });
  return handleHealthCheck(req, res, next);
});

// Rota do webhook do Google Forms (com validação)
router.post(
  "/webhook/google-forms",
  logRequestData,
  validateFormData,
  asyncHandler(async (req, res, next) => {
    console.log('[ROUTE] POST /webhook/google-forms', { requestId: req.requestId });
    return handleGoogleFormsWebhook(req, res, next);
  })
);

// Rota de teste (sem validação, pois usa dados mock)
router.post(
  "/test-webhook",
  asyncHandler(async (req, res, next) => {
    console.log('[ROUTE] POST /test-webhook', { requestId: req.requestId });
    return handleTestWebhook(req, res, next);
  })
);

export default router;
