import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// ----CONFIGURAÇÃO DO GOOGLE CREDENTIALS COM ARQUIVO JSON----//

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o seu ficheiro de credenciais JSON
const KEYFILEPATH = path.join(__dirname, '..', 'google-credentials.json');

// ------------------------------------------------------------//

const CALENDAR_IDS = [
    'ccvisita@gmail.com',
    'ccsetoreducativo@gmail.com'
];

let auth;
//----CONFIGURAÇÃO DO GOOGLE CREDENTIALS COM VARIÁVEL DE AMBIENTE----//
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    logger.info('AUTENTICAÇÃO VIA VARIÁVEL DE AMBIENTE');
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/calendar.events']
    });
    //----------------------------------------------------------------//
} else {
    logger.info('AUTENTICAÇÃO VIA ARQUIVO JSON');
    auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: ['https://www.googleapis.com/auth/calendar.events']
    });
}

const calendar = google.calendar({ version: 'v3', auth });

export async function createGoogleCalendarEvent(eventData) {
    const creationPromises = CALENDAR_IDS.map(calendarId => {
        logger.info(`- Criando evento na agenda: ${calendarId}`);
        return calendar.events.insert({
            calendarId: calendarId,
            resource: eventData,
        });
    });

    try {
        const results = await Promise.all(creationPromises);
        results.forEach((response, index) => {
            logger.info(`Eventos criados com sucesso - Link para agenda ${CALENDAR_IDS[index]}: ${response.data.htmlLink}`);
        });

        return results;
    } catch (error) {
        logger.error('Erro ao criar evento numa das agendas do Google:', error.message);
        throw error;
    }
}

export async function updateCancelledEvent(eventMappings) {
    logger.info(`Atualizando ${eventMappings.length} evento(s) para o estado cancelado...`);

    const updatePromises = eventMappings.map(async (mapping) => {
        try {
            const currentEvent = await calendar.events.get({
                calendarId: mapping.calendarId,
                eventId: mapping.eventId,
            });

            const originalSummary = currentEvent.data.summary;

            const patchData = {
                summary: `(CANCELADO) ${originalSummary}`,
                colorId: '4'
            };

            logger.info(`- Atualizando evento ${mapping.eventId} na agenda ${mapping.calendarId}`);
            return calendar.events.patch({
                calendarId: mapping.calendarId,
                eventId: mapping.eventId,
                resource: patchData,
            });

        } catch (error) {
            logger.error(`Erro ao atualizar o evento ${mapping.eventId} na agenda ${mapping.calendarId}:`, error.message);
            return null;
        }
    });

    await Promise.all(updatePromises);
    logger.info("Atualização de eventos cancelados concluída.");
}