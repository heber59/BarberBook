const axios = require("axios");

const API_BASE = "http://localhost:4000/api";

async function createTestBarber() {
  try {
    console.log("👨‍💼 Creando barbero de prueba...");

    const barberResponse = await axios.post(`${API_BASE}/auth/register`, {
      name: "Barbero Principal",
      email: "barbero@test.com",
      password: "password123",
    });

    console.log("✅ Barbero creado:");
    console.log("ID:", barberResponse.data.id);
    console.log("Nombre:", barberResponse.data.name);
    console.log("Email:", barberResponse.data.email);

    return barberResponse.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log("ℹ️  El barbero ya existe, obteniendo barberos...");
      const barbersResponse = await axios.get(`${API_BASE}/barbers`);
      return barbersResponse.data[0];
    }
    console.error(
      "❌ Error creando barbero:",
      error.response?.data || error.message
    );
    throw error;
  }
}

createTestBarber();
