import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { isSlotAvailable } from "../../services/availabilityService"; // ✅ Cambiar aquí

export const confirmAppointment = {
  schema: {
    tags: ["AI Agent"],
    summary: "Confirmar cita via AI",
    description: "Confirma y crea una cita después de la selección via chat",
    body: {
      type: "object",
      required: ["clientPhone", "barberId", "startAt", "endAt"],
      properties: {
        clientPhone: { type: "string" },
        barberId: { type: "string" },
        startAt: { type: "string", format: "date-time" },
        endAt: { type: "string", format: "date-time" },
        clientName: { type: "string" },
        notes: { type: "string" },
      },
    },
    response: {
      201: {
        description: "Cita confirmada exitosamente",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          appointment: {
            type: "object",
            properties: {
              id: { type: "string" },
              barber: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
              client: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  phone: { type: "string" },
                },
              },
              startAt: { type: "string", format: "date-time" },
              endAt: { type: "string", format: "date-time" },
              status: { type: "string" },
              notes: { type: "string" },
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
        clientPhone: z.string(),
        barberId: z.string(),
        startAt: z.string().datetime(),
        endAt: z.string().datetime(),
        clientName: z.string().optional(),
        notes: z.string().optional(),
      });

      const { clientPhone, barberId, startAt, endAt, clientName, notes } =
        schema.parse(request.body);


      const barber = await request.server.prisma.barber.findUnique({
        where: { id: barberId },
      });

      if (!barber) {
        reply.status(400).send({ error: "Barbero no encontrado" });
        return;
      }

      const available = await isSlotAvailable(
        barberId,
        new Date(startAt),
        new Date(endAt)
      );

      if (!available) {
        reply
          .status(400)
          .send({ error: "El horario seleccionado ya no está disponible" });
        return;
      }

      let client = await request.server.prisma.client.findUnique({
        where: { phone: clientPhone },
      });

      if (!client) {
        client = await request.server.prisma.client.create({
          data: {
            phone: clientPhone,
            name: clientName || "Cliente",
          },
        });
      }

      const appointment = await request.server.prisma.appointment.create({
        data: {
          barberId,
          clientId: client.id,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          notes: notes || "Cita agendada via AI Assistant",
        },
        include: {
          barber: {
            select: {
              id: true,
              name: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      const appointmentDate = new Date(startAt);
      const formattedDate = appointmentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return reply.status(201).send({
        success: true,
        message: `✅ ¡Cita confirmada! Te esperamos el ${formattedDate}`,
        appointment,
      });
    } catch (error) {
      console.error("Error confirming appointment:", error);
      reply.status(500).send({ error: "Error confirmando la cita" });
    }
  },
};
