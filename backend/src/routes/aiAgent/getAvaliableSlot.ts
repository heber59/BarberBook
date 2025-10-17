import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getAvailableSlots } from "../../services/availabilityService";

export const getAvailableSlotsHandler = {
  schema: {
    tags: ["AI Agent"],
    summary: "Obtener slots disponibles",
    description:
      "Obtiene los horarios disponibles para un barbero en una fecha específica",
    querystring: {
      type: "object",
      required: ["barberId", "date"],
      properties: {
        barberId: { type: "string" },
        date: { type: "string", format: "date" },
      },
    },
    response: {
      200: {
        description: "Slots disponibles",
        type: "object",
        properties: {
          date: { type: "string" },
          barberId: { type: "string" },
          availableSlots: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start: { type: "string", format: "date-time" },
                end: { type: "string", format: "date-time" },
                display: { type: "string" },
              },
            },
          },
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
        barberId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      });

      const { barberId, date } = schema.parse(request.query);

      const targetDate = new Date(date);
      const availableSlots = await getAvailableSlots(barberId, targetDate);

      const formattedSlots = availableSlots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        display: `${slot.start.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      }));

      return {
        date,
        barberId,
        availableSlots: formattedSlots,
      };
    } catch (error) {
      console.error("Error getting available slots:", error);
      reply.status(500).send({ error: "Error getting available slots" });
    }
  },
};
