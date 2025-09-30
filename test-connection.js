import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';

// Carrega as variáveis de ambiente
dotenv.config();

async function testGoogleCalendarConnection() {
    console.log('🔍 Testando conexão com Google Calendar...\n');

    try {
        // 1. Verificar se o arquivo de credenciais existe
        console.log('1. Verificando arquivo de credenciais...');
        const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (!keyFile) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurado no .env');
        }

        if (!fs.existsSync(keyFile)) {
            throw new Error(`Arquivo de credenciais não encontrado: ${keyFile}`);
        }

        console.log('✅ Arquivo de credenciais encontrado');

        // 2. Mostrar o email da conta de serviço
        console.log('\n2. Email da conta de serviço:');
        const serviceAccount = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
        console.log(`📧 ${serviceAccount.client_email}`);
        console.log('💡 Este email deve ter permissão nos calendários!');

        // 3. Verificar se as variáveis estão configuradas
        console.log('\n3. Verificando variáveis de ambiente...');
        console.log(`GOOGLE_SERVICE_ACCOUNT_KEY: ${keyFile}`);
        console.log(`GOOGLE_CALENDAR_ID: ${process.env.GOOGLE_CALENDAR_ID}`);
        console.log(`CALENDAR_IDS configurado: ${!!process.env.CALENDAR_IDS}`);
        console.log('✅ Variáveis configuradas');

        // 4. Testar autenticação com escopos corretos
        console.log('\n4. Testando autenticação...');
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFile,
            scopes: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ],
        });

        const authClient = await auth.getClient();
        console.log('✅ Autenticação bem-sucedida');

        // 5. Testar acesso à API do Calendar
        console.log('\n5. Testando acesso à API do Calendar...');
        const calendar = google.calendar({ version: 'v3', auth });

        // Lista os calendários para verificar acesso
        console.log('   Listando calendários acessíveis...');
        const calendarList = await calendar.calendarList.list();
        console.log('✅ Acesso à API do Calendar confirmado');
        console.log(`📅 Encontrados ${calendarList.data.items.length} calendários acessíveis`);

        // Mostrar alguns calendários encontrados
        if (calendarList.data.items.length > 0) {
            console.log('\n   Calendários encontrados:');
            calendarList.data.items.slice(0, 5).forEach((cal, index) => {
                console.log(`   ${index + 1}. ${cal.summary} (${cal.id})`);
            });
            if (calendarList.data.items.length > 5) {
                console.log(`   ... e mais ${calendarList.data.items.length - 5} calendários`);
            }
        }

        // 6. Verificar acesso ao calendário principal
        console.log('\n6. Verificando acesso ao calendário principal...');
        const mainCalendarId = process.env.GOOGLE_CALENDAR_ID;

        try {
            const calendarInfo = await calendar.calendars.get({
                calendarId: mainCalendarId
            });
            console.log(`✅ Acesso ao calendário principal: ${calendarInfo.data.summary}`);
        } catch (error) {
            console.log(`❌ Erro ao acessar calendário principal: ${error.message}`);
            console.log('💡 Verifique se a conta de serviço tem acesso ao calendário');

            // Tentar encontrar o calendário na lista
            const foundCalendar = calendarList.data.items.find(cal =>
                cal.id === mainCalendarId || cal.id.includes(mainCalendarId.split('@')[0])
            );

            if (foundCalendar) {
                console.log(`💡 Calendário encontrado na lista: ${foundCalendar.summary}`);
            } else {
                console.log('💡 Calendário não encontrado na lista de calendários acessíveis');
            }
        }

        // 7. Testar criação de evento de teste
        console.log('\n7. Testando criação de evento...');
        try {
            const testEvent = {
                summary: 'Teste de Conexão - Sistema Supera',
                description: 'Evento de teste para verificar se a integração está funcionando',
                start: {
                    dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    timeZone: 'America/Sao_Paulo',
                },
                end: {
                    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    timeZone: 'America/Sao_Paulo',
                },
            };

            const result = await calendar.events.insert({
                calendarId: mainCalendarId,
                resource: testEvent,
            });

            console.log('✅ Evento de teste criado com sucesso!');
            console.log(`🔗 Link do evento: ${result.data.htmlLink}`);

            // Deletar o evento de teste
            await calendar.events.delete({
                calendarId: mainCalendarId,
                eventId: result.data.id,
            });
            console.log('🗑️ Evento de teste removido');

        } catch (error) {
            console.log(`❌ Erro ao criar evento: ${error.message}`);
            console.log('💡 Verifique se a conta de serviço tem permissão de "Fazer alterações nos eventos"');
        }

        // 8. Verificar estrutura do CALENDAR_IDS
        console.log('\n8. Verificando mapeamento de calendários...');
        try {
            const calendarIds = JSON.parse(process.env.CALENDAR_IDS);
            console.log('✅ CALENDAR_IDS válido');
            console.log(`📋 Espaços configurados: ${Object.keys(calendarIds).length}`);

            Object.entries(calendarIds).forEach(([space, id]) => {
                console.log(`   - ${space}: ${id}`);
            });
        } catch (error) {
            console.log(`❌ Erro no CALENDAR_IDS: ${error.message}`);
        }

        console.log('\n🎉 Todos os testes passaram! Sistema pronto para uso.');

    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);
        console.log('\n🔧 Próximos passos para resolver:');
        console.log('1. Verificar se a Google Calendar API está HABILITADA no Google Cloud Console');
        console.log('2. Ir em APIs & Services > Library > Buscar "Google Calendar API" > Habilitar');
        console.log('3. Verificar se o arquivo service-account.json está correto');
        console.log('4. Verificar se a conta de serviço tem as permissões corretas');
    }
}

// Executar o teste
testGoogleCalendarConnection();