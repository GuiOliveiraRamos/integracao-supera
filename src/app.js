import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
import { createGoogleCalendarEvent, updateCancelledEvent } from './calendarConfig.js';
import logger from './logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const processedAttendees = new Set();

const eventbriteToGoogleMap = new Map();

app.use(express.json());

/**
 * @param {Array} answers - O array 'answers' do objeto do participante.
 * @param {string} questionText - O texto exato da pergunta que você quer encontrar.
 * @param {string} [defaultValue=''] - O valor a ser retornado se a resposta não for encontrada.
 * @returns {string} A resposta encontrada ou o valor padrão.
 */
function findAnswerByQuestion(answers, partialText, defaultValue = 'Não informado') {
    const foundAnswer = answers.find(a => a.question.includes(partialText) && a.answer);
    return foundAnswer ? foundAnswer.answer : defaultValue;
}

function formatBrazilianDate(dateString) {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

app.get('/', (req, res) => {
    res.send('Servidor de integração está no ar!');
});

app.post('/webhook/eventbrite', async (req, res) => {
    logger.info('--- Webhook do Eventbrite recebido! ---');

    if (req.body.config && req.body.config.action === 'test') {
        logger.info('Recebida requisição de teste. Ignorando.');
        return res.status(200).send('Teste recebido com sucesso.');
    }

    const apiUrl = req.body.api_url;
    if (!apiUrl) {
        logger.error('URL da API não fornecida no corpo da requisição.');
        return res.status(400).send('URL da API não fornecida.');
    }

    try {
        const attendeeResponse = await axios.get(apiUrl, {
            headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
        });
        const attendeeData = attendeeResponse.data;
        const attendeeId = attendeeData.id;

        if (attendeeData.cancelled) {
            logger.info(`Participante ${attendeeId} cancelado. Procurando evento correspondente...`);
            if (eventbriteToGoogleMap.has(attendeeId)) {
                const eventMappingsToUpdate = eventbriteToGoogleMap.get(attendeeId);
                await updateCancelledEvent(eventMappingsToUpdate);
                eventbriteToGoogleMap.delete(attendeeId);
            } else {
                logger.info(`Nenhum evento encontrado para o participante ${attendeeId}.`);
            }
            return res.status(200).send('Evento cancelado com sucesso.');
        }

        if (processedAttendees.has(attendeeId)) {
            logger.info(`Participante ${attendeeId} já processado. Ignorando esta atualização.`);
            return res.status(200).send('Atualização ignorada, participante já processado.');
        }
        processedAttendees.add(attendeeId);

        const eventId = attendeeData.event_id;
        const eventDetailsUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/`;
        const eventResponse = await axios.get(eventDetailsUrl, {
            headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
        });
        const eventData = eventResponse.data;

        const eventName = eventData.name.text || '';
        if (!eventName.toUpperCase().includes('ESCOLAS')) {
            logger.info(`- Pedido do participante ${attendeeId} ignorado (Evento: "${eventName}" não é para escolas).`);
            return res.status(200).send('Webhook recebido e ignorado (evento não aplicável).');
        }

        // data extract
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
        let numAlunos = findAnswerByQuestion(answers, 'Número de alunos');
        if (numAlunos === 'Não informado') {
            numAlunos = findAnswerByQuestion(answers, 'Número de visitantes');
        }
        const numAcompanhantes = findAnswerByQuestion(answers, 'Número de acompanhantes');
        const atendimentoEspecializado = findAnswerByQuestion(answers, 'Há idosos ou pessoas que necessitam de atendimento especializado no grupo?');

        const atividade1Obj = answers.find(a => a.question === "Selecione as atividades do roteiro" && a.answer);
        const atividade1 = atividade1Obj ? atividade1Obj.answer : 'Não informada';

        const atividade2Obj = answers.find(a => a.question === "Segunda atividade" && a.answer);
        const atividade2 = atividade2Obj ? atividade2Obj.answer : 'Não informada';

        // CALENDAR EVENT CREATION
        const descriptionLines = [
            `<b>WebHook by guilherme</b>`,
            `<b>Data da compra:</b> ${dataCompra}`,
            `<b>Data da visita:</b> ${dataVisita}`,
            `<b>Número do pedido:</b> ${numeroPedido}`,
            '',
            `<b>Responsável:</b> ${nomeResponsavel}`,
            `<b>Email:</b> ${emailResponsavel}`,
            `<b>Celular do resp.:</b> ${celular}`,
            `<b>Cargo na escola:</b> ${cargo}`,
            `<b>CPF:</b> ${cpf}`,
            `<b>Tipo:</b> ${tipoEscola}`,
            `<b>Cidade:</b> ${cidade}`,
            `<b>Bairro:</b> ${bairro}`,
            `<b>Telefone:</b> ${telefoneEscola}`,
            `<b>Ano escolar:</b> ${anoEscolar}`,
            `<b>Idade:</b> ${idadeAlunos}`,
            `<b>Número de alunos:</b> ${numAlunos}`,
            `<b>Número de acompanhantes:</b> ${numAcompanhantes}`,
            '',
            `<b>Primeira Atividade:</b> ${atividade1}`,
            `<b>Segunda Atividade:</b> ${atividade2}`,
            '',
            `<b>Há idosos ou pessoas que necessitam de atendimento especializado no grupo?</b> ${atendimentoEspecializado}`
        ];

        const descriptionHtml = descriptionLines.join('<br>');

        const googleEvent = {
            summary: `${nomeEscola || 'Visita Agendada'}`,
            description: descriptionHtml,
            start: { dateTime: eventData.start.local, timeZone: eventData.start.timezone },
            end: { dateTime: eventData.end.local, timeZone: eventData.end.timezone },
        };

        const createdEventsInfo = await createGoogleCalendarEvent(googleEvent);

        if (createdEventsInfo && createdEventsInfo.length > 0) {
            eventbriteToGoogleMap.set(attendeeId, createdEventsInfo);
            logger.info(`Dados guardados para o evento ${attendeeId}.`);
        }
        res.status(200).send('Webhook processado e evento criado com sucesso.');
    } catch (error) {
        logger.error('Erro no processamento do webhook:', error.response ? error.response.data : error.message);
        res.status(500).send('Erro ao processar o webhook.');
    }
});

app.listen(PORT, () => {
    logger.info(`Servidor de integração está no ar!`);
});
