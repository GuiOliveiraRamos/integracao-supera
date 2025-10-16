/**
 * Controller para gerenciar webhooks do Google Forms
 */
import {
  processFormSubmission,
  createTestEvent,
} from "../services/calendar.service.js";

/**
 * Controller para processar webhook do Google Forms
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 */
export async function handleGoogleFormsWebhook(req, res) {
  try {
    const formData = req.body;
    const result = await processFormSubmission(formData);

    res.status(200).json({
      ...result,
      message: "Evento criado com sucesso!",
    });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error.message);
    throw error; // Será capturado pelo errorHandler middleware
  }
}

/**
 * Controller para teste do webhook
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 */
export async function handleTestWebhook(req, res) {
  console.log("--- Endpoint de teste chamado! ---");

  const testData = {
    timestamp: new Date().toISOString(),
    responseId: "test-123",
    respondentEmail: "teste@superaparque.com",
    responses: {
      "Nome do evento": "Reunião de Planejamento 2024",
      "Data da reserva": "2025-10-15",
      "Horário de início (Formato 24hrs)": "14:00",
      "Horário de fim (Formato 24hrs)": "16:00",
      "Espaço autorizado para reserva": "Sala de Reunião - Prédio 1",
      Nome: "João Silva",
      "E-mail": "joao.silva@superaparque.com",
      "Número de telefone com DDD (WhatsApp)": "(11) 99999-9999",
      Cargo: "Coordenador",
      "Departamento ou empresa (startups) no qual trabalha":
        "Supera Parque - Inovação",
      "Nome do responsável do Supera Parque que autorizou o agendamento:":
        "Maria Santos",
    },
  };

  try {
    const result = await createTestEvent(testData);

    res.status(200).json({
      ...result,
      message: "Teste executado com sucesso!",
      testData: testData,
    });
  } catch (error) {
    console.error("Erro no teste:", error.message);
    throw error; // Será capturado pelo errorHandler middleware
  }
}

/**
 * Controller para status do servidor
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 */
export function handleHealthCheck(req, res) {
  res.status(200).json({
    status: "online",
    message: "Servidor de integração Supera Parque está no ar! 🚀",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "GET /",
      webhook: "POST /webhook/google-forms",
      test: "POST /test-webhook",
    },
  });
}
