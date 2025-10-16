/**
 * Utilitário para processar e validar datas e horários
 */

/**
 * Formata a data para o padrão YYYY-MM-DD
 * @param {string} dataReserva - Data no formato DD/MM/YYYY ou YYYY-MM-DD
 * @returns {string} - Data formatada
 */
export function formatDate(dataReserva) {
  if (dataReserva.includes("/")) {
    const [dia, mes, ano] = dataReserva.split("/");
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }
  return dataReserva;
}

/**
 * Formata o horário para o padrão HH:MM
 * @param {string} horario - Horário no formato HH:MM ou HH
 * @returns {string} - Horário formatado
 */
export function formatTime(horario) {
  if (!horario) {
    throw new Error("Horário não pode ser vazio");
  }
  return horario.includes(":") ? horario : `${horario}:00`;
}

/**
 * Cria um objeto Date no fuso horário de Brasília
 * @param {string} data - Data no formato YYYY-MM-DD
 * @param {string} horario - Horário no formato HH:MM
 * @returns {Date} - Objeto Date
 */
export function createBrasiliaDate(data, horario) {
  const dateString = `${data}T${horario}:00-03:00`;
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error(`Data ou horário inválido: ${dateString}`);
  }

  return date;
}

/**
 * Processa o horário da reserva a partir das respostas do formulário
 * @param {Object} responses - Respostas normalizadas do formulário
 * @returns {Object} - { startDate: Date, endDate: Date }
 */
export function parseHorarioReserva(responses) {
  try {
    const dataReserva = responses["Data da reserva"];
    const horaInicio = responses["Horário de início"];
    const horaFim = responses["Horário de fim"];

    // Validar campos obrigatórios
    if (!dataReserva) {
      throw new Error('Campo "Data da reserva" é obrigatório');
    }
    if (!horaInicio) {
      throw new Error('Campo "Horário de início" é obrigatório');
    }
    if (!horaFim) {
      throw new Error('Campo "Horário de fim" é obrigatório');
    }

    // Processar e formatar
    const dataFormatada = formatDate(dataReserva);
    const horaInicioFormatada = formatTime(horaInicio);
    const horaFimFormatada = formatTime(horaFim);

    // Criar objetos Date
    const startDate = createBrasiliaDate(dataFormatada, horaInicioFormatada);
    const endDate = createBrasiliaDate(dataFormatada, horaFimFormatada);

    // Validar se horário de fim é após horário de início
    if (endDate <= startDate) {
      throw new Error("Horário de fim deve ser posterior ao horário de início");
    }

    console.log(
      `Data/hora processada: ${startDate.toLocaleString(
        "pt-BR"
      )} - ${endDate.toLocaleString("pt-BR")}`
    );

    return { startDate, endDate };
  } catch (error) {
    console.error("Erro ao processar horário:", error.message);
    throw new Error(`Erro ao processar horário da reserva: ${error.message}`);
  }
}
