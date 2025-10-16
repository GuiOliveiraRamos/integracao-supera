/**
 * Serviço para gerenciar eventos do Google Calendar
 */
import { createGoogleCalendarEvent } from "../calendarConfig.js";
import { getCalendarIdBySpace } from "../utils/calendarMapper.js";
import { parseHorarioReserva } from "../utils/dateParser.js";
import { buildEventData } from "../utils/eventBuilder.js";
import { normalizeFieldNames } from "../schemas/formData.schema.js";

/**
 * Processa os dados do formulário e cria um evento no Google Calendar
 * @param {Object} formData - Dados completos do formulário
 * @returns {Promise<Object>} - Resultado da criação do evento
 */
export async function processFormSubmission(formData) {
  // Extrair respostas do formulário
  const responses = normalizeFieldNames(formData.responses || {});

  // Extrair campos principais
  const nomeEvento = responses["Nome do evento"];
  const espacoAutorizado = responses["Espaço autorizado para reserva"];

  // Validar campos obrigatórios principais
  if (!nomeEvento) {
    throw new Error('Campo "Nome do evento" é obrigatório');
  }
  if (!espacoAutorizado) {
    throw new Error('Campo "Espaço autorizado para reserva" é obrigatório');
  }

  // Processar horário
  const { startDate, endDate } = parseHorarioReserva(responses);

  // Construir dados do evento
  const eventData = buildEventData(responses, startDate, endDate);

  // Determinar o calendário baseado no espaço
  const calendarId = getCalendarIdBySpace(espacoAutorizado);

  console.log(`Criando evento "${nomeEvento}" no espaço: ${espacoAutorizado}`);
  console.log(
    `Horário: ${startDate.toLocaleString("pt-BR")} - ${endDate.toLocaleString(
      "pt-BR"
    )}`
  );
  console.log(`Calendar ID: ${calendarId}`);

  // Criar evento no Google Calendar
  const result = await createGoogleCalendarEvent(eventData, null, calendarId);

  console.log("Evento criado com sucesso!", {
    eventId: result.id,
    eventLink: result.htmlLink,
    space: espacoAutorizado,
  });

  return {
    success: true,
    eventId: result.id,
    eventLink: result.htmlLink,
    space: espacoAutorizado,
    eventData: {
      title: nomeEvento,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

/**
 * Cria um evento de teste no Google Calendar
 * @param {Object} testData - Dados de teste
 * @returns {Promise<Object>} - Resultado da criação do evento
 */
export async function createTestEvent(testData) {
  return await processFormSubmission(testData);
}
