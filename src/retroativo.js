import axios from 'axios';
import dotenv from 'dotenv';
// Certifique-se de que o nome do ficheiro está correto
import { createGoogleCalendarEvent } from './calendarConfig.js';

dotenv.config();

// --- CONFIGURAÇÕES ---
const ORGANIZATION_ID = '243518744741'; // O seu ID da Organização correto
// Define a data de início da busca (7 de Julho de 2025, 15:00 no fuso de São Paulo)
const START_DATE_BRT = '2025-07-07T10:00:00-03:00';

// Formata a data para o padrão UTC exigido pela API (YYYY-MM-DDTHH:mm:ssZ)
const START_DATE_UTC = new Date(START_DATE_BRT).toISOString().split('.')[0] + 'Z';

// --- FUNÇÕES AUXILIARES ---
function findAnswerByQuestion(answers, questionText, defaultValue = 'Não informado') {
    const foundAnswer = answers.find(a => a.question === questionText);
    return foundAnswer && foundAnswer.answer ? foundAnswer.answer : defaultValue;
}

function formatBrazilianDate(dateString) {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Função principal que busca e processa os pedidos retroativos.
 */
async function processRetroactiveOrders() {
    console.log(`Buscando pedidos alterados desde: ${START_DATE_UTC}`);

    let url = `https://www.eventbriteapi.com/v3/organizations/${ORGANIZATION_ID}/orders/?changed_since=${START_DATE_UTC}`;

    const processedAttendees = new Set();

    while (url) {
        try {
            console.log(`\nBuscando página de pedidos em: ${url}`);
            const ordersResponse = await axios.get(url, {
                headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
            });

            const orders = ordersResponse.data.orders;
            console.log(`Encontrados ${orders.length} pedidos nesta página.`);

            if (orders.length === 0 && !ordersResponse.data.pagination.has_more_items) {
                console.log("Nenhum pedido novo encontrado no período especificado.");
                break;
            }

            for (const order of orders) {
                if (order.status !== 'placed') {
                    console.log(`- Pedido ${order.id} ignorado (status: ${order.status}).`);
                    continue;
                }

                try {
                    const attendeeDetailsUrl = `${order.resource_uri}attendees/`;
                    const attendeeResponse = await axios.get(attendeeDetailsUrl, {
                        headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
                    });

                    const attendeeData = attendeeResponse.data.attendees[0];
                    if (!attendeeData || attendeeData.cancelled) {
                        console.log(`- Participante do pedido ${order.id} ignorado (não encontrado ou cancelado).`);
                        continue;
                    }

                    const attendeeId = attendeeData.id;
                    if (processedAttendees.has(attendeeId)) {
                        console.log(`- Participante ${attendeeId} já processado nesta execução. Pulando.`);
                        continue;
                    }
                    processedAttendees.add(attendeeId);

                    console.log(`-- Processando Participante: ${attendeeData.profile.name} (Pedido: ${order.id})`);

                    const eventId = attendeeData.event_id;
                    const eventDetailsUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/`;
                    const eventResponse = await axios.get(eventDetailsUrl, {
                        headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
                    });
                    const eventData = eventResponse.data;

                    const answers = attendeeData.answers || [];
                    const profile = attendeeData.profile;
                    const dataCompra = formatBrazilianDate(attendeeData.created);
                    const dataVisita = formatBrazilianDate(eventData.start.local);
                    const numeroPedido = attendeeData.order_id;
                    const nomeResponsavel = profile.name;
                    const emailResponsavel = profile.email;
                    const celular = findAnswerByQuestion(answers, 'Celular do(a) responsável pelo agendamento');
                    const cargo = findAnswerByQuestion(answers, 'Cargo na escola/grupo');
                    const cpf = findAnswerByQuestion(answers, 'CPF');
                    const nomeEscola = findAnswerByQuestion(answers, 'ESCOLA/GRUPO');
                    const tipoEscola = findAnswerByQuestion(answers, 'Tipo de ESCOLA/GRUPO');
                    const cidade = findAnswerByQuestion(answers, 'Cidade da ESCOLA/GRUPO');
                    const bairro = findAnswerByQuestion(answers, 'Bairro da ESCOLA/GRUPO');
                    const telefoneEscola = findAnswerByQuestion(answers, 'Telefone da ESCOLA/GRUPO');
                    const anoEscolar = findAnswerByQuestion(answers, 'Ano escolar dos alunos/visitantes');
                    const idadeAlunos = findAnswerByQuestion(answers, 'Idade dos alunos/visitantes');
                    const numAlunos = findAnswerByQuestion(answers, 'Número de alunos (mín. 20 máx. 40)');
                    const numAcompanhantes = findAnswerByQuestion(answers, 'Número de acompanhantes (máx. 5)');
                    const atendimentoEspecializado = findAnswerByQuestion(answers, 'Há idosos ou pessoas que necessitam de atendimento especializado no grupo?');
                    const atividade1Obj = answers.find(a => a.question === "Selecione as atividades do roteiro" && a.answer);
                    const atividade1 = atividade1Obj ? atividade1Obj.answer : 'Não informada';
                    const atividade2Obj = answers.find(a => a.question === "Segunda atividade" && a.answer);
                    const atividade2 = atividade2Obj ? atividade2Obj.answer : 'Não informada';

                    const descriptionLines = [
                        `<b>WebHook by guilherme</b>`, `<b>Data da compra:</b> ${dataCompra}`, `<b>Data da visita:</b> ${dataVisita}`, `<b>Número do pedido:</b> ${numeroPedido}`, '',
                        `<b>Responsável:</b> ${nomeResponsavel}`, `<b>Email:</b> ${emailResponsavel}`, `<b>Celular do resp.:</b> ${celular}`, `<b>Cargo na escola:</b> ${cargo}`, `<b>CPF:</b> ${cpf}`,
                        `<b>Tipo:</b> ${tipoEscola}`, `<b>Cidade:</b> ${cidade}`, `<b>Bairro:</b> ${bairro}`, `<b>Telefone:</b> ${telefoneEscola}`, `<b>Ano escolar:</b> ${anoEscolar}`, `<b>Idade:</b> ${idadeAlunos}`,
                        `<b>Número de alunos:</b> ${numAlunos}`, `<b>Número de acompanhantes:</b> ${numAcompanhantes}`, '', `<b>Primeira Atividade:</b> ${atividade1}`, `<b>Segunda Atividade:</b> ${atividade2}`, '',
                        `<b>Há idosos ou pessoas que necessitam de atendimento especializado no grupo?</b> ${atendimentoEspecializado}`
                    ];

                    const descriptionHtml = descriptionLines.join('<br>');

                    const googleEvent = {
                        summary: `${nomeEscola || 'Visita Agendada'}`,
                        description: descriptionHtml,
                        start: { dateTime: eventData.start.local, timeZone: eventData.start.timezone },
                        end: { dateTime: eventData.end.local, timeZone: eventData.end.timezone },
                    };

                    await createGoogleCalendarEvent(googleEvent);
                    console.log(`--- Evento para ${profile.name} criado com sucesso!`);
                    await delay(500);

                } catch (attendeeError) {
                    console.error(`---- ERRO ao processar o pedido ${order.id}:`, attendeeError.message);
                }
            }

            // CORREÇÃO FINAL: Mantém o filtro de data na paginação
            if (ordersResponse.data.pagination.has_more_items) {
                const continuation = ordersResponse.data.pagination.continuation;
                url = `https://www.eventbriteapi.com/v3/organizations/${ORGANIZATION_ID}/orders/?changed_since=${START_DATE_UTC}&continuation=${continuation}`;
            } else {
                url = null;
            }

        } catch (error) {
            console.error('ERRO GERAL ao buscar a lista de pedidos. A API do Eventbrite retornou um erro.');
            if (error.response) {
                console.error('Status do Erro:', error.response.status);
                console.error('Dados do Erro:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error('Erro ao configurar a requisição:', error.message);
            }
            url = null;
        }
    }

    console.log('\nProcessamento retroativo concluído!');
}

processRetroactiveOrders();
