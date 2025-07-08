import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obter o caminho do diretório atual ao usar ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o seu arquivo de credenciais JSON
const KEYFILEPATH = path.join(__dirname, '..', 'google-credentials.json');

// ID do seu Google Agenda. Encontre nas configurações da agenda.
const CALENDAR_ID = 'ccvisita@gmail.com';

// Configura a autenticação usando a Conta de Serviço
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

// Cria uma instância do cliente da API do Calendar
const calendar = google.calendar({ version: 'v3', auth });

/**
 * Cria um novo evento no Google Calendar.
 * @param {object} eventData - O objeto do evento a ser criado.
 */
export async function createGoogleCalendarEvent(eventData) {
    try {
        console.log('Enviando evento para o Google Calendar...');
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: eventData,
            sendNotifications: true, // Envia notificação para os convidados
        });
        console.log('Evento criado com sucesso! Link:', response.data.htmlLink);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar evento no Google Calendar:', error.message);
        // Lança o erro para que a rota principal possa tratá-lo
        throw error;
    }
}
