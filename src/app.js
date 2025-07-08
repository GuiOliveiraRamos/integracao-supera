import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
// Corrigido para o nome do seu arquivo, com a extensão .js
import { createGoogleCalendarEvent } from './calendarConfig.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Corrigido o nome da variável para 'processedAttendees'
const processedAttendees = new Set();

app.use(express.json());

/**
 * Encontra a resposta para uma pergunta específica pelo texto da pergunta.
 * @param {Array} answers - O array 'answers' do objeto do participante.
 * @param {string} questionText - O texto exato da pergunta que você quer encontrar.
 * @param {string} [defaultValue=''] - O valor a ser retornado se a resposta não for encontrada.
 * @returns {string} A resposta encontrada ou o valor padrão.
 */
function findAnswerByQuestion(answers, questionText, defaultValue = 'Não informado') {
    const foundAnswer = answers.find(a => a.question === questionText);
    return foundAnswer && foundAnswer.answer ? foundAnswer.answer : defaultValue;
}

/**
 * Formata uma data no padrão brasileiro (DD/MM/YYYY HH:MM:SS).
 * @param {string} dateString - A data em formato ISO.
 * @returns {string} A data formatada.
 */
function formatBrazilianDate(dateString) {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}


app.get('/', (req, res) => {
    res.send('Servidor de integração está no ar!');
});

app.post('/webhook/eventbrite', async (req, res) => {
    console.log('--- Webhook do Eventbrite recebido! ---');
    console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2));

    if (req.body.config && req.body.config.action === 'test') {
        console.log('Recebida requisição de teste. Ignorando.');
        return res.status(200).send('Teste recebido com sucesso.');
    }

    const apiUrl = req.body.api_url;
    if (!apiUrl) {
        console.error('URL da API não fornecida no corpo da requisição.');
        return res.status(400).send('URL da API não fornecida.');
    }

    try {
        const attendeeResponse = await axios.get(apiUrl, {
            headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
        });
        const attendeeData = attendeeResponse.data;
        const attendeeId = attendeeData.id;

        if (processedAttendees.has(attendeeId)) {
            console.log(`Participante ${attendeeId} já processado. Ignorando esta atualização.`);
            return res.status(200).send('Atualização ignorada, participante já processado.');
        }
        processedAttendees.add(attendeeId);

        const eventId = attendeeData.event_id;
        const eventDetailsUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/`;
        const eventResponse = await axios.get(eventDetailsUrl, {
            headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
        });
        const eventData = eventResponse.data;

        // --- EXTRAÇÃO DE DADOS ---
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


        // --- CONSTRUÇÃO CONTROLADA DO HTML ---
        const descriptionLines = [
            `<b>Data da compra:</b> ${dataCompra}`,
            `<b>Data da visita:</b> ${dataVisita}`,
            `<b>Número do pedido:</b> ${numeroPedido}`,
            '', // Linha em branco
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
            '', // Linha em branco
            `<b>Primeira Atividade:</b> ${atividade1}`,
            `<b>Segunda Atividade:</b> ${atividade2}`,
            '', // Linha em branco
            `<b>Há idosos ou pessoas que necessitam de atendimento especializado no grupo?</b> ${atendimentoEspecializado}`
        ];

        const descriptionHtml = descriptionLines.join('<br>');

        const googleEvent = {
            summary: ` ${nomeEscola || 'Visita Agendada'}`,
            description: descriptionHtml,
            start: { dateTime: eventData.start.local, timeZone: eventData.start.timezone },
            end: { dateTime: eventData.end.local, timeZone: eventData.end.timezone },
        };

        console.log('Enviando para o Google Calendar...');
        await createGoogleCalendarEvent(googleEvent);

        res.status(200).send('Webhook processado e evento criado com sucesso.');

    } catch (error) {
        console.error('Erro no processamento do webhook:', error.response ? error.response.data : error.message);
        res.status(500).send('Erro ao processar o webhook.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
