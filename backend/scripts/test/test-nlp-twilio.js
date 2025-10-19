const axios = require("axios");

const API_BASE = "http://localhost:4000/api";

async function getOrCreateBarber() {
  try {
    const barbersResponse = await axios.get(`${API_BASE}/barbers`);
    if (barbersResponse.data.length > 0) {
      return barbersResponse.data[0];
    }

    const barberCreate = await axios.post(`${API_BASE}/barbers`, {
      name: "Barbero NLP Test",
      email: "nlp@test.com",
      password: "test123",
    });
    return barberCreate.data;
  } catch (error) {
    console.log(
      "Error obteniendo barbero:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Test de NLP con mensajes de ejemplo
async function testNLP() {
  console.log("🧠 Probando NLP con diferentes mensajes...\n");

  const barber = await getOrCreateBarber();
  console.log(`Usando barbero: ${barber.name}\n`);

  const testMessages = [
    "Hola, quiero agendar una cita para el viernes a las 3pm",
    "Necesito cancelar mi cita de mañana",
    "¿Qué horarios tienen disponibles?",
    "Quiero reservar el lunes a las 10am",
    "Hola, mi nombre es María y quiero una cita para cortarme el pelo",
  ];

  for (const message of testMessages) {
    console.log(`📝 Mensaje: "${message}"`);

    try {
      const response = await axios.post(`${API_BASE}/ai/chat`, {
        message: message,
        clientPhone: "+1234567890",
        barberId: barber.id,
      });

      console.log(
        "🤖 Respuesta AI:",
        response.data.response.substring(0, 150) + "..."
      );
      console.log("Tipo:", response.data.type);
      console.log("---\n");
    } catch (error) {
      console.log("❌ Error:", error.response?.data || error.message);
      console.log("---\n");
    }
  }
}

// Test de flujo completo de WhatsApp
async function testWhatsAppFlow() {
  console.log("📱 Probando flujo de WhatsApp...\n");

  const barber = await getOrCreateBarber();

  const whatsappMessages = [
    {
      phone: "+51987654321",
      message: "Hola, quiero agendar una cita para el viernes",
    },
    {
      phone: "+51987654321",
      message: "¿Qué horarios tienen disponibles?",
    },
    {
      phone: "+51987654321",
      message: "Perfecto, reservo el viernes a las 2pm",
    },
  ];

  for (const msg of whatsappMessages) {
    console.log(`💬 WhatsApp de ${msg.phone}: ${msg.message}`);

    try {
      const response = await axios.post(`${API_BASE}/ai/chat`, {
        message: msg.message,
        clientPhone: msg.phone,
        barberId: barber.id,
      });

      console.log(
        "🤖 Respuesta:",
        response.data.response.substring(0, 100) + "..."
      );
      console.log("Acción:", response.data.action);
      console.log("---\n");

      // Si hay suggestedSlots, mostrar algunos
      if (response.data.suggestedSlots) {
        console.log("🕐 Slots sugeridos:");
        response.data.suggestedSlots.slice(0, 3).forEach((slot) => {
          console.log(`   - ${slot.display}`);
        });
        console.log("---\n");
      }
    } catch (error) {
      console.log("❌ Error:", error.response?.data || error.message);
      console.log("---\n");
    }
  }
}

async function main() {
  console.log("🎯 Iniciando pruebas de NLP y WhatsApp...\n");

  await testNLP();
  await testWhatsAppFlow();

  console.log("✅ Pruebas completadas");
}

main().catch(console.error);
