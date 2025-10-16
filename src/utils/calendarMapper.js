/**
 * Utilitário para mapear espaços para IDs de calendários
 */

// Mapeamento dos espaços do formulário para as chaves dos calendários
const SPACE_MAPPING = {
  "Supera Parque": "SUPERA_PARQUE",
  "Biblioteca frente": "BIBLIOTECA_FRENTE",
  "Biblioteca fundo": "BIBLIOTECA_FUNDO",
  "Sala 1 - Prédio 2": "SALA_1_PREDIO_2",
  "Sala 2 - Prédio 2": "SALA_2_PREDIO_2",
  "Sala de Reunião do Prédio 1": "SALA_REUNIAO_PREDIO_1",
  "Sala de Reunião - Prédio 1": "SALA_REUNIAO_PREDIO_1", // Variação aceita
  "Sala de treinamento do Contêiner": "SALA_TREINAMENTO",
  "Sala do SuperaLab": "SALA_SUPERA_LAB",
};

/**
 * Obtém o ID do calendário baseado no espaço selecionado
 * @param {string} espacoSelecionado - Nome do espaço selecionado no formulário
 * @returns {string} - ID do calendário do Google
 * @throws {Error} - Se o espaço não for encontrado
 */
export function getCalendarIdBySpace(espacoSelecionado) {
  const calendarIds = JSON.parse(process.env.CALENDAR_IDS);

  const calendarKey = SPACE_MAPPING[espacoSelecionado];

  if (!calendarKey) {
    const availableSpaces = Object.keys(SPACE_MAPPING).join(", ");
    throw new Error(
      `Espaço não encontrado: ${espacoSelecionado}. Espaços disponíveis: ${availableSpaces}`
    );
  }

  const calendarId = calendarIds[calendarKey];

  if (!calendarId) {
    throw new Error(
      `Calendar ID não configurado para: ${calendarKey}. Verifique as variáveis de ambiente.`
    );
  }

  return calendarId;
}

/**
 * Lista todos os espaços disponíveis
 * @returns {string[]} - Array com nomes dos espaços
 */
export function getAvailableSpaces() {
  return Object.keys(SPACE_MAPPING);
}

/**
 * Verifica se um espaço é válido
 * @param {string} espacoSelecionado - Nome do espaço
 * @returns {boolean} - True se o espaço existe
 */
export function isValidSpace(espacoSelecionado) {
  return SPACE_MAPPING.hasOwnProperty(espacoSelecionado);
}
