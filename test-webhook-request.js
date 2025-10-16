// Script Node.js para testar o webhook
// Execute com: node test-webhook-request.js

const testData = {
  timestamp: new Date().toISOString(),
  responseId: "test-123",
  respondentEmail: "teste@superaparque.com",
  responses: {
    "Nome do responsável do Supera Parque que autorizou o agendamento:":
      "Maria Santos",
    "Nome do evento": "Reunião de Planejamento 2024",
    "Data da reserva": "2025-10-15",
    "Horário de início (Formato 24hrs)": "14:00",
    "Horário de fim (Formato 24hrs)": "16:00",
    "Espaço autorizado para reserva": "Sala de Reunião - Prédio 1",
    Nome: "João Silva",
    "E-mail": "joao.silva@superaparque.com",
    "Número de telefone com DDD (WhatsApp)": "(11) 99999-9999",
    Cargo: "Coordenador",
    "Departamento ou empresa (startups) no qual trabalha":
      "Supera Parque - Inovação",
  },
};

console.log("🧪 Testando webhook do Supera Parque...\n");

fetch("http://localhost:3000/test-webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(testData),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("✅ Teste executado com sucesso!\n");
    console.log("Resposta:");
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error("❌ Erro ao executar teste:", error.message);
  });
