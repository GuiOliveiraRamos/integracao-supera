import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obter o caminho do diretório atual ao usar ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o seu ficheiro de credenciais JSON
const KEYFILEPATH = path.join(__dirname, '..', 'google-credentials.json');

const CALENDAR_IDS = [
    'ccvisita@gmail.com',
    'ccsetoreducativo@gmail.com'
];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

export async function createGoogleCalendarEvent(eventData) {
    console.log(`Enviando evento para ${CALENDAR_IDS.length} agenda(s)...`);

    const creationPromises = CALENDAR_IDS.map(calendarId => {
        console.log(`- Criando evento na agenda: ${calendarId}`);
        return calendar.events.insert({
            calendarId: calendarId,
            resource: eventData,
        });
    });

    try {
        const results = await Promise.all(creationPromises);
        console.log('Evento criado com sucesso em todas as agendas!');

        results.forEach((response, index) => {
            console.log(`  - Link para agenda ${CALENDAR_IDS[index]}: ${response.data.htmlLink}`);
        });

        return results;
    } catch (error) {
        console.error('Erro ao criar evento numa das agendas do Google:', error.message);
        throw error;
    }
}

export async function updateCancelledEvent(eventMappings) {
    console.log(`Atualizando ${eventMappings.length} evento(s) para o estado cancelado...`);

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

            console.log(`- Atualizando evento ${mapping.eventId} na agenda ${mapping.calendarId}`);
            return calendar.events.patch({
                calendarId: mapping.calendarId,
                eventId: mapping.eventId,
                resource: patchData,
            });

        } catch (error) {
            console.error(`Erro ao atualizar o evento ${mapping.eventId} na agenda ${mapping.calendarId}:`, error.message);
            return null;
        }
    });

    await Promise.all(updatePromises);
    console.log("Atualização de eventos cancelados concluída.");
}