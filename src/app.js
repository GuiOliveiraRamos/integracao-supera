import express from 'express';
import dotenv from 'dotenv';
import { createGoogleCalendarEvent } from './calendarConfig.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mapeamento dos espaços do formulário para os calendários
function getCalendarIdBySpace(espacoSelecionado) {
    const calendarIds = JSON.parse(process.env.CALENDAR_IDS);

    const spaceMapping = {
        'Supera Parque': 'SUPERA_PARQUE',
        'Biblioteca frente': 'BIBLIOTECA_FRENTE',
        'Biblioteca fundo': 'BIBLIOTECA_FUNDO',
        'Sala 1 - Prédio 2': 'SALA_1_PREDIO_2',
        'Sala 2 - Prédio 2': 'SALA_2_PREDIO_2',
        'Sala de Reunião do Prédio 1': 'SALA_REUNIAO_PREDIO_1',
        'Sala de treinamento do Contêiner': 'SALA_TREINAMENTO',
        'Sala do SuperaLab': 'SALA_SUPERA_LAB'
    };

    const calendarKey = spaceMapping[espacoSelecionado];
    if (!calendarKey) {
        throw new Error(`Espaço não encontrado: ${espacoSelecionado}. Espaços disponíveis: ${Object.keys(spaceMapping).join(', ')}`);
    }

    return calendarIds[calendarKey];
}

// Função para processar horário da reserva - 3 perguntas separadas
function parseHorarioReserva(responses) {
    try {
        const dataReserva = responses['Data da reserva'];
        const horaInicio = responses['Horário de início'] ||
            responses['Horário de inicio'] ||
            responses['Horário de início (Formato 24hrs)'];
        const horaFim = responses['Horário de fim'] ||
            responses['Horário final'] ||
            responses['Horário de fim (Formato 24hrs)'];

        // Validar se todos os campos estão presentes
        if (!dataReserva) {
            throw new Error('Campo "Data da reserva" é obrigatório');
        }
        if (!horaInicio) {
            throw new Error('Campo "Horário de início" é obrigatório. Campos disponíveis: ' + Object.keys(responses).join(', '));
        }
        if (!horaFim) {
            throw new Error('Campo "Horário de fim" é obrigatório. Campos disponíveis: ' + Object.keys(responses).join(', '));
        }

        // Processar data - Google Forms pode retornar "2024-01-15" ou "15/01/2024"
        let dataFormatada = dataReserva;
        if (dataReserva.includes('/')) {
            const [dia, mes, ano] = dataReserva.split('/');
            dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }

        // Processar horários - garantir formato HH:MM
        const horaInicioFormatada = horaInicio.includes(':') ? horaInicio : `${horaInicio}:00`;
        const horaFimFormatada = horaFim.includes(':') ? horaFim : `${horaFim}:00`;

        // Criar objetos Date
        const startDate = new Date(`${dataFormatada}T${horaInicioFormatada}:00-03:00`);
        const endDate = new Date(`${dataFormatada}T${horaFimFormatada}:00-03:00`);

        // Validar se as datas são válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Data ou horário inválido');
        }

        // Validar se horário de fim é após horário de início
        if (endDate <= startDate) {
            throw new Error('Horário de fim deve ser posterior ao horário de início');
        }

        console.log(`Data/hora processada: ${startDate.toLocaleString('pt-BR')} - ${endDate.toLocaleString('pt-BR')}`);

        return { startDate, endDate };

    } catch (error) {
        console.error('Erro ao processar horário:', error.message);
        throw new Error(`Erro ao processar horário da reserva: ${error.message}`);
    }
}

app.get('/', (req, res) => {
    res.send('Servidor de integração Supera Parque está no ar! 🚀');
});

// Endpoint para receber dados do Google Forms
app.post('/webhook/google-forms', async (req, res) => {
    console.log('--- Webhook do Google Forms recebido! ---');

    try {
        const formData = req.body;
        console.log('Dados recebidos do Google Forms:', JSON.stringify(formData, null, 2));

        // Extrair informações do formulário
        const responses = formData.responses || {};

        // Campos do formulário
        const nomeEvento = responses['Nome do evento'];
        const espacoAutorizado = responses['Espaço autorizado para reserva'];
        const nome = responses['Nome'];
        const email = responses['E-mail'];
        const telefone = responses['Número de telefone com DDD (WhatsApp)'];
        const cargo = responses['Cargo'];
        const departamento = responses['Departamento ou empresa (startups) no qual trabalha'];

        // Validações
        if (!nomeEvento) {
            throw new Error('Campo "Nome do evento" é obrigatório');
        }
        if (!espacoAutorizado) {
            throw new Error('Campo "Espaço autorizado para reserva" é obrigatório');
        }

        // Processar horário (suporta múltiplos formatos)
        const { startDate, endDate } = parseHorarioReserva(responses);

        // Montar descrição
        const descricao = `Nome: ${nome || 'Não informado'}
E-mail: ${email || 'Não informado'}
Número de telefone com DDD (WhatsApp): ${telefone || 'Não informado'}
Cargo: ${cargo || 'Não informado'}
Departamento ou empresa (startups) no qual trabalha: ${departamento || 'Não informado'}`;

        // Preparar dados do evento
        const eventData = {
            summary: nomeEvento,
            description: descricao,
            start: startDate,
            end: endDate,
            attendees: email ? [email] : []
        };

        // Determinar o calendário baseado no espaço
        const calendarId = getCalendarIdBySpace(espacoAutorizado);

        console.log(`Criando evento "${nomeEvento}" no espaço: ${espacoAutorizado}`);
        console.log(`Horário: ${startDate.toLocaleString('pt-BR')} - ${endDate.toLocaleString('pt-BR')}`);
        console.log(`Calendar ID: ${calendarId}`);

        // Criar evento no Google Calendar (passando o calendarId diretamente)
        const result = await createGoogleCalendarEvent(eventData, null, calendarId);

        console.log('Evento criado com sucesso!', {
            eventId: result.id,
            eventLink: result.htmlLink,
            space: espacoAutorizado
        });

        res.status(200).json({
            success: true,
            message: 'Evento criado com sucesso!',
            eventId: result.id,
            eventLink: result.htmlLink,
            space: espacoAutorizado,
            eventData: {
                title: nomeEvento,
                start: startDate.toISOString(),
                end: endDate.toISOString()
            }
        });

    } catch (error) {
        console.error('Erro no processamento do webhook:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para testar o processamento de dados
app.post('/test-webhook', async (req, res) => {
    console.log('--- Endpoint de teste chamado! ---');

    const testData = {
        timestamp: new Date().toISOString(),
        responseId: 'test-123',
        respondentEmail: 'teste@superaparque.com',
        responses: {
            'Nome do evento': 'Reunião de Planejamento 2024',
            'Data da reserva': '2024-01-15',
            'Horário de início (Formato 24hrs)': '14:00',
            'Horário de fim (Formato 24hrs)': '16:00',
            'Espaço autorizado para reserva': 'Sala de Reunião - Prédio 1',
            'Nome': 'João Silva',
            'E-mail': 'joao.silva@superaparque.com',
            'Número de telefone com DDD (WhatsApp)': '(11) 99999-9999',
            'Cargo': 'Coordenador',
            'Departamento ou empresa (startups) no qual trabalha': 'Supera Parque - Inovação'
        }
    };

    // Processar como webhook real
    req.body = testData;

    try {
        const formData = req.body;
        const responses = formData.responses || {};

        const nomeEvento = responses['Nome do evento'];
        const espacoAutorizado = responses['Espaço autorizado para reserva'];
        const nome = responses['Nome'];
        const email = responses['E-mail'];
        const telefone = responses['Número de telefone com DDD (WhatsApp)'];
        const cargo = responses['Cargo'];
        const departamento = responses['Departamento ou empresa (startups) no qual trabalha'];

        const { startDate, endDate } = parseHorarioReserva(responses);

        const descricao = `Nome: ${nome || 'Não informado'}
E-mail: ${email || 'Não informado'}
Número de telefone com DDD (WhatsApp): ${telefone || 'Não informado'}
Cargo: ${cargo || 'Não informado'}
Departamento ou empresa (startups) no qual trabalha: ${departamento || 'Não informado'}`;

        const eventData = {
            summary: nomeEvento,
            description: descricao,
            start: startDate,
            end: endDate,
            attendees: email ? [email] : []
        };

        const result = await createGoogleCalendarEvent(eventData, espacoAutorizado);

        res.status(200).json({
            success: true,
            message: 'Teste executado com sucesso!',
            eventId: result.id,
            eventLink: result.htmlLink,
            testData: testData
        });

    } catch (error) {
        console.error('Erro no teste:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de integração Supera Parque rodando na porta ${PORT}`);
    console.log(`Endpoints disponíveis:`);
    console.log(`  GET  / - Status do servidor`);
    console.log(`  POST /webhook/google-forms - Webhook do Google Forms`);
    console.log(`  POST /test-webhook - Teste local`);
});
