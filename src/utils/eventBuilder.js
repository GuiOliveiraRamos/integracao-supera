/**
 * Utilitário para construir dados de eventos
 */

/**
 * Constrói a descrição do evento a partir dos dados do formulário
 * @param {Object} responses - Respostas do formulário
 * @returns {string} - Descrição formatada
 */
export function buildEventDescription(responses) {
  const nome = responses["Nome"] || "Não informado";
  const email = responses["E-mail"] || "Não informado";
  const telefone =
    responses["Número de telefone com DDD (WhatsApp)"] || "Não informado";
  const cargo = responses["Cargo"] || "Não informado";
  const departamento =
    responses["Departamento ou empresa (startups) no qual trabalha"] ||
    "Não informado";
  const responsavelAutorizacao =
    responses[
      "Nome do responsável do Supera Parque que autorizou o agendamento:"
    ] || "Não informado";

  return `Nome: ${nome}
E-mail: ${email}
Número de telefone com DDD (WhatsApp): ${telefone}
Cargo: ${cargo}
Departamento ou empresa (startups) no qual trabalha: ${departamento}
Responsável pela autorização: ${responsavelAutorizacao}`;
}

/**
 * Constrói o objeto de dados do evento para o Google Calendar
 * @param {Object} responses - Respostas do formulário
 * @param {Date} startDate - Data/hora de início
 * @param {Date} endDate - Data/hora de fim
 * @returns {Object} - Dados do evento
 */
export function buildEventData(responses, startDate, endDate) {
  const nomeEvento = responses["Nome do evento"];
  const email = responses["E-mail"];
  const descricao = buildEventDescription(responses);

  return {
    summary: nomeEvento,
    description: descricao,
    start: startDate,
    end: endDate,
    attendees: email ? [email] : [],
  };
}
