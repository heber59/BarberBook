import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getWeeklyAvailability } from "../../services/availabilityService";
import { isSlotAvailable } from "../../services/availabilityService";

const extractAppointmentDetails = (message: string) => {
  const lowerMessage = message.toLowerCase();

  // Extraer día
  const dayMatches: { [key: string]: number } = {
    lunes: 1,
    martes: 2,
    miércoles: 3,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sábado: 6,
    sabado: 6,
    domingo: 0,
  };

  let targetDay: number | null = null;
  for (const [dayName, dayNumber] of Object.entries(dayMatches)) {
    if (lowerMessage.includes(dayName)) {
      targetDay = dayNumber;
      break;
    }
  }

  // Extraer hora (mejorado)
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs|horas)?/i;
  const timeMatch = lowerMessage.match(timeRegex);
  let targetTime: string | null = null;

  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3] ? timeMatch[3].toLowerCase() : "";

    // Convertir a formato 24h
    if (period.includes("pm") && hour < 12) hour += 12;
    if (period.includes("am") && hour === 12) hour = 0;

    targetTime = `${hour.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  // Detectar intenciones específicas
  const intents = {
    book:
      lowerMessage.includes("agendar") ||
      lowerMessage.includes("reservar") ||
      lowerMessage.includes("quiero") ||
      lowerMessage.includes("necesito") ||
      /cita|turno/.test(lowerMessage),
    cancel:
      lowerMessage.includes("cancelar") || lowerMessage.includes("eliminar"),
    query:
      lowerMessage.includes("disponibilidad") ||
      lowerMessage.includes("horarios") ||
      lowerMessage.includes("libre") ||
      lowerMessage.includes("cuándo"),
  };

  return {
    targetDay,
    targetTime,
    intents,
    hasSpecificDetails: !!(targetDay && targetTime),
  };
};

// Función para encontrar slot más cercano al día/hora solicitado
const findBestSlot = (
  weeklyAvailability: any,
  targetDay: number,
  targetTime: string
) => {
  for (const [date, slots] of Object.entries(weeklyAvailability)) {
    const dateObj = new Date(date as string);
    if (dateObj.getDay() === targetDay && (slots as any[]).length > 0) {
      // Si hay hora específica, buscar la más cercana
      if (targetTime) {
        const targetDateTime = new Date(date);
        const [targetHour, targetMinute] = targetTime.split(":").map(Number);
        targetDateTime.setHours(targetHour, targetMinute, 0, 0);

        // Encontrar slot más cercano a la hora solicitada
        const closestSlot = (slots as any[]).reduce((closest, slot) => {
          const slotTime = new Date(slot.start).getTime();
          const targetTimeValue = targetDateTime.getTime();
          const currentDiff = Math.abs(slotTime - targetTimeValue);
          const closestDiff = Math.abs(
            new Date(closest.start).getTime() - targetTimeValue
          );

          return currentDiff < closestDiff ? slot : closest;
        });

        return { date, slot: closestSlot };
      }

      return { date, slot: (slots as any[])[0] };
    }
  }
  return null;
};

const handleCancelIntent = async (
  message: string,
  clientPhone: string,
  barberId: string,
  request: FastifyRequest
) => {
  try {
    const now = new Date();
    const clientAppointments = await request.server.prisma.appointment.findMany(
      {
        where: {
          client: { phone: clientPhone },
          barberId,
          startAt: { gt: now },
          status: "scheduled",
        },
        include: {
          barber: { select: { name: true } },
        },
        orderBy: { startAt: "asc" },
      }
    );

    if (clientAppointments.length === 0) {
      return {
        response: "No tienes citas programadas para cancelar.",
        type: "cancel",
        action: "no_appointments",
      };
    }

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("mañana") || lowerMessage.includes("manana")) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowAppointments = clientAppointments.filter((apt) => {
        const aptDate = new Date(apt.startAt);
        return aptDate.toDateString() === tomorrow.toDateString();
      });

      if (tomorrowAppointments.length > 0) {
        await request.server.prisma.appointment.update({
          where: { id: tomorrowAppointments[0].id },
          data: { status: "canceled" },
        });

        const aptTime = new Date(tomorrowAppointments[0].startAt);
        return {
          response: `✅ He cancelado tu cita de mañana a las ${formatTime(
            aptTime
          )}.`,
          type: "cancel",
          action: "cancelled",
        };
      }
    }

    const appointmentList = clientAppointments
      .slice(0, 3)
      .map((apt) => {
        const aptTime = new Date(apt.startAt);
        return `• ${getDayName(aptTime)} ${formatDate(
          apt.startAt.toISOString()
        )} a las ${formatTime(aptTime)}`;
      })
      .join("\n");

    return {
      response: `Tienes estas citas programadas:\n${appointmentList}\n\n¿Cuál te gustaría cancelar?`,
      type: "cancel",
      action: "list_appointments",
      appointments: clientAppointments,
    };
  } catch (error) {
    console.error("Error in cancel intent:", error);
    return {
      response:
        "Lo siento, hubo un error al procesar tu solicitud de cancelación.",
      type: "error",
    };
  }
};

const handleSpecificBooking = async (
  message: string,
  clientPhone: string,
  barberId: string,
  request: FastifyRequest
) => {
  const details = extractAppointmentDetails(message);

  if (!details.targetDay) {
    return await handleAppointmentIntent(message, barberId);
  }

  const weeklyAvailability = await getWeeklyAvailability(barberId);
  const bestSlot = findBestSlot(
    weeklyAvailability,
    details.targetDay,
    details.targetTime || ""
  );

  if (!bestSlot) {
    const dayNames = [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ];
    return {
      response: `No hay horarios disponibles para el ${
        dayNames[details.targetDay]
      }. Te muestro la disponibilidad completa:`,
      type: "availability",
      action: "specific_day_unavailable",
      availability: weeklyAvailability,
    };
  }

  const available = await isSlotAvailable(
    barberId,
    new Date(bestSlot.slot.start),
    new Date(bestSlot.slot.end)
  );

  if (!available) {
    return {
      response: `El horario seleccionado ya no está disponible. Te muestro otros horarios:`,
      type: "availability",
      action: "slot_unavailable",
      availability: weeklyAvailability,
    };
  }

  let client = await request.server.prisma.client.findUnique({
    where: { phone: clientPhone },
  });

  if (!client) {
    client = await request.server.prisma.client.create({
      data: { phone: clientPhone, name: "Cliente" },
    });
  }

  try {
    const appointment = await request.server.prisma.appointment.create({
      data: {
        barberId,
        clientId: client.id,
        startAt: new Date(bestSlot.slot.start),
        endAt: new Date(bestSlot.slot.end),
        notes: `Cita agendada via AI: ${message}`,
      },
      include: {
        barber: { select: { name: true } },
        client: { select: { name: true, phone: true } },
      },
    });

    const appointmentTime = new Date(appointment.startAt);
    return {
      response: `✅ ¡Cita confirmada! Te esperamos el ${getDayName(
        appointmentTime
      )} ${formatDate(bestSlot.date)} a las ${formatTime(appointmentTime)}.`,
      type: "appointment_confirmed",
      action: "specific_booking",
      appointment,
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return {
      response:
        "Lo siento, hubo un error al agendar la cita. Por favor, intenta de nuevo.",
      type: "error",
    };
  }
};

const processAIMessage = async (
  message: string,
  clientId: string,
  barberId: string,
  clientPhone: string,
  request: FastifyRequest
) => {
  const details = extractAppointmentDetails(message);
  const lowerMessage = message.toLowerCase();

  if (details.intents.cancel) {
    return await handleCancelIntent(message, clientPhone, barberId, request);
  }

  if (details.intents.book && details.hasSpecificDetails) {
    return await handleSpecificBooking(message, clientPhone, barberId, request);
  }

  if (details.intents.book) {
    return await handleAppointmentIntent(message, barberId);
  }

  if (details.intents.query) {
    return await handleAvailabilityIntent(barberId);
  }

  if (
    lowerMessage.includes("hola") ||
    lowerMessage.includes("buenas") ||
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi")
  ) {
    return {
      response:
        "¡Hola! Soy tu asistente de barbería 🤖\n\nPuedo ayudarte a:\n• 📅 Agendar una cita\n• 🕐 Consultar horarios disponibles\n• ✂️ Reservar con tu barbero favorito\n• ❌ Cancelar una cita\n\n¿En qué te puedo ayudar?",
      type: "greeting",
    };
  }

  return {
    response:
      "Entendido! Puedo ayudarte a:\n• Agendar citas (di 'quiero una cita el viernes a las 3pm')\n• Consultar horarios disponibles\n• Cancelar citas (di 'cancelar mi cita de mañana')\n\n¿En qué te puedo ayudar?",
    type: "fallback",
  };
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

const handleAppointmentIntent = async (message: string, barberId: string) => {
  const weeklyAvailability = await getWeeklyAvailability(barberId);

  let response = "Te muestro los horarios disponibles para esta semana:\n\n";
  let suggestedSlots: any[] = [];

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
    suggestedSlots: suggestedSlots.slice(0, 5),
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

      let client = await request.server.prisma.client.findUnique({
        where: { phone: clientPhone },
      });

      if (!client) {
        client = await request.server.prisma.client.create({
          data: { phone: clientPhone, name: "Cliente" },
        });
      }

      const aiResponse = await processAIMessage(
        message,
        client.id,
        barberId,
        clientPhone,
        request
      );

      return reply.send(aiResponse);
    } catch (error) {
      console.error("Error in AI chat:", error);
      reply.status(500).send({ error: "Error processing message" });
    }
  },
};
