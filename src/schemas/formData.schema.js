/**
 * Schema de validação para dados do formulário
 */
export const formDataSchema = {
  requiredFields: [
    "Nome do evento",
    "Espaço autorizado para reserva",
    "Data da reserva",
    "Horário de início",
    "Horário de fim",
  ],

  optionalFields: [
    "Nome do responsável do Supera Parque que autorizou o agendamento:",
    "Nome",
    "E-mail",
    "Número de telefone com DDD (WhatsApp)",
    "Cargo",
    "Departamento ou empresa (startups) no qual trabalha",
  ],

  // Variações de nomes de campos aceitas
  fieldAliases: {
    "Horário de início": [
      "Horário de inicio",
      "Horário de início (Formato 24hrs)",
    ],
    "Horário de fim": ["Horário final", "Horário de fim (Formato 24hrs)"],
  },
};

/**
 * Valida se todos os campos obrigatórios estão presentes
 * @param {Object} responses - Respostas do formulário
 * @returns {Object} - { isValid: boolean, missingFields: string[] }
 */
export function validateRequiredFields(responses) {
  const missingFields = [];

  for (const field of formDataSchema.requiredFields) {
    // Verificar campo principal
    if (!responses[field]) {
      // Verificar aliases
      const aliases = formDataSchema.fieldAliases[field] || [];
      const hasAlias = aliases.some((alias) => responses[alias]);

      if (!hasAlias) {
        missingFields.push(field);
      }
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Normaliza os nomes dos campos usando aliases
 * @param {Object} responses - Respostas do formulário
 * @returns {Object} - Respostas normalizadas
 */
export function normalizeFieldNames(responses) {
  const normalized = { ...responses };

  for (const [mainField, aliases] of Object.entries(
    formDataSchema.fieldAliases
  )) {
    if (!normalized[mainField]) {
      for (const alias of aliases) {
        if (normalized[alias]) {
          normalized[mainField] = normalized[alias];
          break;
        }
      }
    }
  }

  return normalized;
}
