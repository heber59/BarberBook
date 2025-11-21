const axios = require("axios");

const API_BASE = "http://localhost:4000/api";

async function testAIFlow() {
  try {
    console.log("🚀 Iniciando prueba del flujo AI...\n");

    // 1. Probar conexión con el servidor
    console.log("1. Probando conexión con el servidor...");
    const healthResponse = await axios.get(`http://localhost:4000/health`);
    console.log(`✅ Servidor: ${healthResponse.data.status}\n`);

    // 2. Obtener o crear barbero
    console.log("2. Obteniendo barberos...");
    let barber;

    try {
      const barbersResponse = await axios.get(`${API_BASE}/barbers`);

      if (barbersResponse.data.length === 0) {
        console.log("📝 No hay barberos, creando uno...");
        const barberCreate = await axios.post(`${API_BASE}/barbers`, {
          name: "Barbero Test",
          email: "test@barbero.com",
          password: "test123",
        });
        barber = barberCreate.data;
      } else {
        barber = barbersResponse.data[0];
      }

      console.log(
        `✅ Barberos encontrados: ${barber.name} (ID: ${barber.id})\n`
      );
    } catch (error) {
      console.log(
        "❌ Error con barberos:",
        error.response?.data || error.message
      );
      return;
    }

    // 3. Probar el chat del AI
    console.log("3. Probando chat con AI...");
    try {
      const chatResponse = await axios.post(`${API_BASE}/ai/chat`, {
        message: "Hola, quiero agendar una cita para cortarme el cabello",
        clientPhone: "+1234567890",
        barberId: barber.id,
      });

      console.log("🤖 Respuesta del AI:");
      console.log(chatResponse.data.response);
      console.log("Tipo:", chatResponse.data.type);
      console.log("");
    } catch (error) {
      console.log(
        "❌ Error en chat AI:",
        error.response?.data || error.message
      );
    }

    // 4. Probar consulta de disponibilidad
    console.log("4. Probando consulta de disponibilidad...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    try {
      const slotsResponse = await axios.get(`${API_BASE}/ai/available-slots`, {
        params: {
          barberId: barber.id,
          date: dateStr,
        },
      });

      console.log(`📅 Slots disponibles para ${dateStr}:`);
      if (
        slotsResponse.data.availableSlots &&
        slotsResponse.data.availableSlots.length > 0
      ) {
        slotsResponse.data.availableSlots.forEach((slot, index) => {
          console.log(`   ${index + 1}. ⏰ ${slot.display}`);
        });

        // 5. Probar confirmación de cita si hay slots
        console.log("\n5. Probando confirmación de cita...");
        const slot = slotsResponse.data.availableSlots[0];

        const confirmResponse = await axios.post(
          `${API_BASE}/ai/confirm-appointment`,
          {
            clientPhone: "+1234567890",
            barberId: barber.id,
            startAt: slot.start,
            endAt: slot.end,
            clientName: "Cliente Test",
            notes: "Cita de prueba AI",
          }
        );

        console.log("✅ Confirmación:");
        console.log(confirmResponse.data.message);
      } else {
        console.log("   No hay slots disponibles para esta fecha");
      }
    } catch (error) {
      console.log(
        "❌ Error obteniendo slots:",
        error.response?.data || error.message
      );
    }

    console.log("\n🎉 ¡Prueba completada!");
    console.log("\n📚 Documentación: http://localhost:4000/docs");
  } catch (error) {
    console.error("\n❌ Error en la prueba:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.code === "ECONNREFUSED") {
      console.error("No se puede conectar al servidor en puerto 4000");
      console.error("Ejecuta: docker compose up -d");
    } else {
      console.error("Error:", error.message);
    }
  }
}

testAIFlow();
