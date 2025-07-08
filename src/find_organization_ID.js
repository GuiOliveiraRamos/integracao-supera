import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script de execução única para encontrar o ID da sua organização no Eventbrite.
 */
async function findMyOrganizationId() {
    console.log("Buscando o ID da sua organização...");
    const url = 'https://www.eventbriteapi.com/v3/users/me/organizations/';

    // Verifica se o token foi carregado
    if (!process.env.EVENTBRITE_PRIVATE_TOKEN) {
        console.error("ERRO: A variável EVENTBRITE_PRIVATE_TOKEN não foi encontrada no ficheiro .env.");
        return;
    }

    try {
        const response = await axios.get(url, {
            headers: { "Authorization": `Bearer ${process.env.EVENTBRITE_PRIVATE_TOKEN}` }
        });

        const organizations = response.data.organizations;

        if (organizations && organizations.length > 0) {
            console.log("\nOrganizações encontradas! ✅");
            console.log("-----------------------------------------");
            organizations.forEach(org => {
                console.log(`Nome da Organização: ${org.name}`);
                console.log(`ID da Organização: ${org.id}`); // <<< ESTE É O NÚMERO QUE VOCÊ PRECISA
                console.log("-----------------------------------------");
            });
            console.log("\nCopie o 'ID da Organização' acima e cole na variável ORGANIZATION_ID do seu script 'retroativo.js'.");
        } else {
            console.log("Nenhuma organização foi encontrada para a sua conta. Verifique se a sua chave de API tem as permissões corretas.");
        }

    } catch (error) {
        console.error("Ocorreu um erro ao buscar as organizações.");
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Erro:', error.message);
        }
    }
}

findMyOrganizationId();
