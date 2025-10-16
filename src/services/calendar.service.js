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
  console.log('[SERVICE] processFormSubmission:start', {
    hasResponses: !!formData?.responses,
    responseKeys: formData?.responses ? Object.keys(formData.responses) : [],
  });
  // Extrair respostas do formulário
  const responses = normalizeFieldNames(formData.responses || {});

  // Extrair campos principais
  const nomeEvento = responses["Nome do evento"];
  const espacoAutorizado = responses["Espaço autorizado para reserva"];

  // Validar campos obrigatórios principais
  if (!nomeEvento) {
    console.error('[SERVICE] MissingField', { field: 'Nome do evento' });
    throw new Error('Campo "Nome do evento" é obrigatório');
  }
  if (!espacoAutorizado) {
    console.error('[SERVICE] MissingField', { field: 'Espaço autorizado para reserva' });
    throw new Error('Campo "Espaço autorizado para reserva" é obrigatório');
  }

  // Processar horário
  const { startDate, endDate } = parseHorarioReserva(responses);
  console.log('[SERVICE] DatesParsed', {
    startISO: startDate?.toISOString?.(),
    endISO: endDate?.toISOString?.(),
  });

  // Construir dados do evento
  const eventData = buildEventData(responses, startDate, endDate);

  // Determinar o calendário baseado no espaço
  const calendarId = getCalendarIdBySpace(espacoAutorizado);
  console.log('[SERVICE] CalendarResolved', { espacoAutorizado, calendarId });

  console.log(`Criando evento "${nomeEvento}" no espaço: ${espacoAutorizado}`);
  console.log(
    `Horário: ${startDate.toLocaleString("pt-BR")} - ${endDate.toLocaleString(
      "pt-BR"
    )}`
  );
  console.log(`Calendar ID: ${calendarId}`);

  // Criar evento no Google Calendar
  const result = await createGoogleCalendarEvent(eventData, null, calendarId);
  console.log('[SERVICE] CalendarAPI:created', { id: result?.id, link: result?.htmlLink });

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
