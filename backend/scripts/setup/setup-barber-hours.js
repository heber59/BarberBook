const axios = require("axios");

const API_BASE = "http://localhost:4000/api";

/**
 * Script para configurar horarios de trabajo de barberos
 * Uso: node scripts/setup/setup-barber-hours.js
 */

async function setupBarberWorkingHours() {
  try {
    console.log("🕐 Configurando horarios de trabajo del barbero...\n");

    // 1. Obtener el barbero
    const barbersResponse = await axios.get(`${API_BASE}/barbers`);
    const barber = barbersResponse.data[0];

    if (!barber) {
      console.log("❌ No hay barberos disponibles");
      console.log(
        "💡 Ejecuta primero: node scripts/test/create-test-barber.js"
      );
      return;
    }

    console.log(`✅ Barberos encontrado: ${barber.name} (ID: ${barber.id})\n`);

    // 2. Configurar horarios de trabajo estándar
    const workingHours = [
      // Lunes a Viernes: 9am - 6pm
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" }, // Lunes
      { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" }, // Martes
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" }, // Miércoles
      { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" }, // Jueves
      { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" }, // Viernes
      // Sábado: 9am - 2pm
      { dayOfWeek: 6, startTime: "09:00", endTime: "14:00" }, // Sábado
      // Domingo: Cerrado (no se incluye)
    ];

    console.log("📅 Configurando horarios...");
    const response = await axios.post(
      `${API_BASE}/barbers/${barber.id}/working-hours`,
      { workingHours }
    );

    console.log("✅ Horarios configurados exitosamente:");
    response.data.workingHours.forEach((wh) => {
      const days = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];
      console.log(
        `   📍 ${days[wh.dayOfWeek]}: ${wh.startTime} - ${wh.endTime}`
      );
    });

    console.log("\n🎉 ¡Ahora el barbero tiene horarios configurados!");
    console.log("🤖 El agente IA podrá mostrar disponibilidad real");
  } catch (error) {
    console.error("❌ Error configurando horarios:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Asegúrate de que el servidor esté corriendo:");
      console.log("   docker compose up -d");
    }
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  setupBarberWorkingHours();
}

module.exports = { setupBarberWorkingHours };
