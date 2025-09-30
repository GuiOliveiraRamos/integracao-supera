import { google } from "googleapis";
import fs from "fs";

// Função para obter o ID do calendário baseado no espaço selecionado
function getCalendarIdBySpace(spaceName) {
  const calendarIds = JSON.parse(process.env.CALENDAR_IDS);

  const spaceMapping = {
    'Supera Parque': 'SUPERA_PARQUE',
    'Biblioteca - Frente': 'BIBLIOTECA_FRENTE',
    'Biblioteca - Fundo': 'BIBLIOTECA_FUNDO',
    'Sala 1 - Prédio 2': 'SALA_1_PREDIO_2',
    'Sala 2 - Prédio 2': 'SALA_2_PREDIO_2',
    'Sala de Reunião - Prédio 1': 'SALA_REUNIAO_PREDIO_1',
    'Sala de Treinamento': 'SALA_TREINAMENTO',
    'Sala Supera Lab': 'SALA_SUPERA_LAB'
  };

  const calendarKey = spaceMapping[spaceName];
  if (!calendarKey) {
    throw new Error(`Espaço não encontrado: ${spaceName}`);
  }

  return calendarIds[calendarKey];
}

export async function createGoogleCalendarEvent(eventData, spaceName = null, calendarId = null) {
  let auth;

  try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      console.log("Autenticação via variável de ambiente");
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
        ],
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log("Autenticação via arquivo JSON");
      const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (fs.existsSync(keyFile)) {
        auth = new google.auth.GoogleAuth({
          keyFile: keyFile,
          scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
          ],
        });
      } else {
        throw new Error("Arquivo de chave do serviço não encontrado.");
      }
    } else {
      throw new Error("Credenciais do Google não configuradas.");
    }

    const calendar = google.calendar({ version: "v3", auth });

    // Determinar qual calendário usar
    let targetCalendarId;
    if (calendarId) {
      targetCalendarId = calendarId;
    } else if (spaceName) {
      targetCalendarId = getCalendarIdBySpace(spaceName);
    } else {
      // Fallback para teste - usar o calendário principal
      targetCalendarId = process.env.GOOGLE_CALENDAR_ID;
    }

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      // Remover attendees para evitar erro de permissions
      // attendees: eventData.attendees?.map(email => ({ email })) || [],
    };

    console.log(`Criando evento no calendário: ${targetCalendarId}`);

    const response = await calendar.events.insert({
      calendarId: targetCalendarId,
      resource: event,
    });

    console.log("Evento criado com sucesso!", response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar evento no Google Calendar:", error);
    throw error;
  }
}

// Exportar também a função para obter calendário por espaço
export { getCalendarIdBySpace };