import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

export const createAppointment = {
  schema: {
    tags: ["Appointments"],
    summary: "Crear nueva cita",
    description: "Crea una nueva cita para un barbero",
    body: {
      type: "object",
      required: ["barberId", "clientPhone", "startAt", "endAt"],
      properties: {
        barberId: { type: "string" },
        clientPhone: { type: "string" },
        clientName: { type: "string" },
        startAt: { type: "string", format: "date-time" },
        endAt: { type: "string", format: "date-time" },
        notes: { type: "string" },
      },
    },
    response: {
      201: {
        description: "Cita creada exitosamente",
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
        clientPhone: z.string(),
        clientName: z.string().optional(),
        startAt: z.string().datetime(),
        endAt: z.string().datetime(),
        notes: z.string().optional(),
      });

      const { barberId, clientPhone, clientName, startAt, endAt, notes } =
        schema.parse(request.body);

      // Verificar que el barbero existe
      const barber = await request.server.prisma.barber.findUnique({
        where: { id: barberId },
      });

      if (!barber) {
        reply.status(400).send({ error: "Barber not found" });
        return;
      }

      // Verificar que no hay citas solapadas
      const conflictingAppointment =
        await request.server.prisma.appointment.findFirst({
          where: {
            barberId,
            OR: [
              {
                startAt: { lt: new Date(endAt) },
                endAt: { gt: new Date(startAt) },
              },
            ],
            status: { not: "canceled" },
          },
        });

      if (conflictingAppointment) {
        reply
          .status(400)
          .send({ error: "Barber is not available at this time" });
        return;
      }

      // Buscar o crear cliente
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

      // Crear la cita
      const appointment = await request.server.prisma.appointment.create({
        data: {
          barberId,
          clientId: client.id,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          notes,
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

      reply.status(201).send(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      reply.status(500).send({ error: "Error creating appointment" });
    }
  },
};
