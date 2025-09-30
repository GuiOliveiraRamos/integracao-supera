// Logger personalizado para Discord (DESABILITADO)
// Este arquivo foi mantido comentado para preservar a implementação original
// do logger com Discord webhook, mas não está sendo usado no projeto atual.

// import axios from 'axios';
// import dotenv from 'dotenv';
// dotenv.config();

// // Lê a URL do webhook do seu ficheiro .env
// const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

// const getTimestamp = () => {
//     return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
// };

// const timestamp = getTimestamp();

// /**
//  * Logger personalizado que envia logs para a consola e para um webhook do Discord.
//  */
// const logger = {
//     info: (message, meta = {}) => {
//         // Envia para a consola local
//         console.log(`[${timestamp}] INFO:`, message, meta);
//         // Envia para o Discord, se a URL estiver configurada
//         if (webhookUrl) {
//             axios.post(webhookUrl, {
//                 content: `\`[${timestamp}]\` ℹ️ **INFO:** ${message}`,
//                 // Envia metadados num bloco de código se existirem
//                 embeds: meta && Object.keys(meta).length > 0 ? [{ description: `\`\`\`json\n${JSON.stringify(meta, null, 2)}\n\`\`\`` }] : []
//             }).catch(e => console.error("Falha ao enviar log 'info' para o Discord:", e.message));
//         }
//     },
//     warn: (message, meta = {}) => {
//         console.warn(`[${timestamp}] WARN:`, message, meta);
//         if (webhookUrl) {
//             axios.post(webhookUrl, {
//                 content: `\`[${timestamp}]\` ⚠️ **WARN:** ${message}`,
//                 embeds: meta && Object.keys(meta).length > 0 ? [{ description: `\`\`\`json\n${JSON.stringify(meta, null, 2)}\n\`\`\``, color: 16776960 }] : [] // Cor amarela
//             }).catch(e => console.error("Falha ao enviar log 'warn' para o Discord:", e.message));
//         }
//     },
//     error: (message, meta = {}) => {
//         console.error(`[${timestamp}] ERROR:`, message, meta);
//         if (webhookUrl) {
//             axios.post(webhookUrl, {
//                 content: `\`[${timestamp}]\` 🔥 **ERROR:** ${message}`,
//                 embeds: meta && Object.keys(meta).length > 0 ? [{ description: `\`\`\`json\n${JSON.stringify(meta, null, 2)}\n\`\`\``, color: 15158332 }] : [] // Cor vermelha
//             }).catch(e => console.error("Falha ao enviar log 'error' para o Discord:", e.message));
//         }
//     },
// };

// export default logger;
