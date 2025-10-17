import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getWeeklyAvailability } from "../../services/availabilityService";

const extractDayFromMessage = (message: string): string[] => {
  const days = [
    { keywords: ["lunes"], day: 1 },
    { keywords: ["martes"], day: 2 },
    { keywords: ["miércoles", "miercoles"], day: 3 },
    { keywords: ["jueves"], day: 4 },
    { keywords: ["viernes"], day: 5 },
    { keywords: ["sábado", "sabado"], day: 6 },
    { keywords: ["domingo"], day: 0 },
  ];

  const foundDays: string[] = [];
  const lowerMessage = message.toLowerCase();

  days.forEach((dayInfo) => {
    if (dayInfo.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      foundDays.push(dayInfo.keywords[0]);
    }
  });

  return foundDays;
};

const getDayName = (date: Date): string => {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[date.getDay()];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES");
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Lógica del agente IA
const handleAppointmentIntent = async (message: string, barberId: string) => {
  const weeklyAvailability = await getWeeklyAvailability(barberId);

  let response = "Te muestro los horarios disponibles para esta semana:\n\n";
  let suggestedSlots: any[] = [];

  // Construir respuesta con disponibilidad
  Object.keys(weeklyAvailability).forEach((date) => {
    const slots = weeklyAvailability[date];
    if (slots.length > 0) {
      const dayName = getDayName(new Date(date));
      response += `**${dayName} (${formatDate(date)})**:\n`;

      slots.forEach((slot: any) => {
        const time = formatTime(slot.start);
        response += `   ⏰ ${time}\n`;
        suggestedSlots.push({
          date: date,
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          display: `${dayName} ${formatDate(date)} a las ${time}`,
        });
      });
      response += "\n";
    }
  });

  if (suggestedSlots.length === 0) {
    response =
      "Lo siento, no hay horarios disponibles esta semana. ¿Te gustaría que verifique para la próxima semana?";
  } else {
    response +=
      '¿Qué día y hora prefieres? Puedes decirme por ejemplo: "El jueves a las 14:00"';
  }

  return {
    response,
    type: "availability",
    availability: weeklyAvailability,
    action: "select_slot",
    suggestedSlots: suggestedSlots.slice(0, 10), // Limitar a 10 sugerencias
  };
};

const handleAvailabilityIntent = async (barberId: string) => {
  const weeklyAvailability = await getWeeklyAvailability(barberId);

  let response = "Estos son los horarios disponibles para esta semana:\n\n";
  let availableDays = 0;

  Object.keys(weeklyAvailability).forEach((date) => {
    const slots = weeklyAvailability[date];
    if (slots.length > 0) {
      availableDays++;
      const dayName = getDayName(new Date(date));
      response += `**${dayName} (${formatDate(date)})**:\n`;

      slots.forEach((slot: any) => {
        const time = formatTime(slot.start);
        response += `   ⏰ ${time}\n`;
      });
      response += "\n";
    }
  });

  if (availableDays === 0) {
    response =
      "No hay horarios disponibles esta semana. Por favor, intenta la próxima semana.";
  }

  return {
    response,
    type: "availability",
    availability: weeklyAvailability,
    action: "show_availability",
  };
};

const processAIMessage = async (
  message: string,
  clientId: string,
  barberId: string
) => {
  const lowerMessage = message.toLowerCase();

  // Detectar intención de agendar cita
  if (
    lowerMessage.includes("agendar") ||
    lowerMessage.includes("cita") ||
    lowerMessage.includes("reservar") ||
    lowerMessage.includes("turno") ||
    lowerMessage.includes("quiero una cita")
  ) {
    return await handleAppointmentIntent(message, barberId);
  }

  // Detectar consulta de disponibilidad
  if (
    lowerMessage.includes("disponibilidad") ||
    lowerMessage.includes("horarios") ||
    lowerMessage.includes("libre") ||
    lowerMessage.includes("cuándo")
  ) {
    return await handleAvailabilityIntent(barberId);
  }

  // Detectar saludo
  if (
    lowerMessage.includes("hola") ||
    lowerMessage.includes("buenas") ||
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi")
  ) {
    return {
      response:
        "¡Hola! Soy tu asistente de barbería 🤖\n\nPuedo ayudarte a:\n• 📅 Agendar una cita\n• 🕐 Consultar horarios disponibles\n• ✂️ Reservar con tu barbero favorito\n\n¿En qué te puedo ayudar?",
      type: "greeting",
    };
  }

  // Respuesta por defecto
  return {
    response:
      "Entendido! Puedo ayudarte a agendar citas o consultar horarios disponibles. ¿Te gustaría ver los horarios disponibles para esta semana?",
    type: "fallback",
  };
};

export const handleAIChat = {
  schema: {
    tags: ["AI Agent"],
    summary: "Chat con el agente IA",
    description: "Procesa mensajes del usuario y responde inteligentemente",
    body: {
      type: "object",
      required: ["message", "clientPhone", "barberId"],
      properties: {
        message: { type: "string" },
        clientPhone: { type: "string" },
        barberId: { type: "string" },
      },
    },
    response: {
      200: {
        description: "Respuesta del agente IA",
        type: "object",
        properties: {
          response: { type: "string" },
          type: { type: "string" },
          availability: { type: "object" },
          action: { type: "string" },
          suggestedSlots: { type: "array" },
        },
      },
      400: {
        description: "Error en los datos",
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      500: {
        description: "Server error",
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const schema = z.object({
        message: z.string(),
        clientPhone: z.string(),
        barberId: z.string(),
      });

      const { message, clientPhone, barberId } = schema.parse(request.body);

      // Buscar o crear cliente por teléfono
      let client = await request.server.prisma.client.findUnique({
        where: { phone: clientPhone },
      });

      if (!client) {
        client = await request.server.prisma.client.create({
          data: { phone: clientPhone, name: "Cliente" },
        });
      }

      // Procesar el mensaje
      const aiResponse = await processAIMessage(message, client.id, barberId);

      return reply.send(aiResponse);
    } catch (error) {
      console.error("Error in AI chat:", error);
      reply.status(500).send({ error: "Error processing message" });
    }
  },
};
