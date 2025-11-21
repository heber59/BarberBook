const axios = require("axios");

const API_BASE = "http://localhost:4000/api";

async function createTestBarber() {
  try {
    console.log("👨‍💼 Creando barbero de prueba...");

    // ✅ CORRECTO: Usar /auth/register para crear barbero
    const barberResponse = await axios.post(`${API_BASE}/auth/register`, {
      name: "Barbero Principal",
      email: "barbero@test.com",
      password: "password123",
    });

    console.log("✅ Barbero creado:", barberResponse.data.name);
    return barberResponse.data;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 409) {
      console.log("ℹ️  El barbero ya existe, obteniendo barberos...");
      try {
        // ✅ CORRECTO: Usar /barbers para obtener barberos existentes
        const barbersResponse = await axios.get(`${API_BASE}/barbers`);
        if (barbersResponse.data && barbersResponse.data.length > 0) {
          console.log("✅ Barbero obtenido:", barbersResponse.data[0].name);
          return barbersResponse.data[0];
        } else {
          throw new Error("No hay barberos disponibles");
        }
      } catch (getError) {
        console.log("❌ Error obteniendo barberos:", getError.message);
        throw getError;
      }
    }
    console.log(
      "❌ Error creando barbero:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function setupWorkingHours(barberId) {
  try {
    console.log("📅 Configurando horarios de trabajo...");

    const workingHours = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 6, startTime: "09:00", endTime: "14:00" },
    ];

    const response = await axios.post(
      `${API_BASE}/barbers/${barberId}/working-hours`,
      {
        workingHours,
      }
    );

    console.log("✅ Horarios configurados");
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error configurando horarios:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createTestAppointments(barberId) {
  try {
    console.log("📝 Creando citas de prueba...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = [
      {
        clientPhone: "+51987654321",
        clientName: "Cliente Ejemplo 1",
        startAt: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10:00
        endAt: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000), // 11:00
        notes: "Corte clásico",
      },
      {
        clientPhone: "+51987654322",
        clientName: "Cliente Ejemplo 2",
        startAt: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000), // 11:00
        endAt: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // 12:00
        notes: "Barba y bigote",
      },
    ];

    for (const apt of appointments) {
      await axios.post(`${API_BASE}/appointments`, {
        barberId,
        ...apt,
      });
    }

    console.log("✅ Citas de prueba creadas");
  } catch (error) {
    console.log(
      "ℹ️  No se pudieron crear citas de prueba:",
      error.response?.data || error.message
    );
  }
}

async function setupTestData() {
  try {
    console.log("🎯 Iniciando configuración de datos de prueba...\n");

    const barber = await createTestBarber();
    console.log("🆔 Barbero ID:", barber.id);

    await setupWorkingHours(barber.id);
    await createTestAppointments(barber.id);

    console.log("\n🎉 ¡Configuración completada!");
    console.log("\n📊 Datos creados:");
    console.log("   👨‍💼 1 Barbero");
    console.log("   📅 6 Días de horarios laborales");
    console.log("   📝 2 Citas de ejemplo");
    console.log("\n🚀 Para probar: node scripts/test/test-ai-flow.js");
  } catch (error) {
    console.error("\n❌ Error en la configuración:");
    console.error(error.response?.data || error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Asegúrate de que el servidor esté corriendo:");
      console.log("   npm run dev");
    }
  }
}

if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData };
