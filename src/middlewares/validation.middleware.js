/**
 * Middleware de validação de dados do formulário
 */
import {
  validateRequiredFields,
  normalizeFieldNames,
} from "../schemas/formData.schema.js";

/**
 * Valida os dados recebidos do webhook do Google Forms
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 * @param {Function} next - Próximo middleware
 */
export function validateFormData(req, res, next) {
  try {
    const formData = req.body;

    // Verificar se há dados no body
    if (!formData || Object.keys(formData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nenhum dado foi recebido no webhook",
      });
    }

    // Verificar se há respostas
    const responses = formData.responses || {};
    if (Object.keys(responses).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nenhuma resposta encontrada nos dados do formulário",
      });
    }

    // Normalizar nomes dos campos
    const normalizedResponses = normalizeFieldNames(responses);
    req.body.responses = normalizedResponses;

    // Validar campos obrigatórios
    const validation = validateRequiredFields(normalizedResponses);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios faltando",
        missingFields: validation.missingFields,
        availableFields: Object.keys(responses),
      });
    }

    // Dados válidos, prosseguir
    next();
  } catch (error) {
    console.error("Erro na validação dos dados:", error.message);
    res.status(400).json({
      success: false,
      error: `Erro na validação: ${error.message}`,
    });
  }
}

/**
 * Middleware para log dos dados recebidos
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 * @param {Function} next - Próximo middleware
 */
export function logRequestData(req, res, next) {
  console.log("--- Webhook do Google Forms recebido! ---");
  console.log("Dados recebidos:", JSON.stringify(req.body, null, 2));
  next();
}
