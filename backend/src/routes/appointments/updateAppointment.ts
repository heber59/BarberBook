import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

interface UpdateAppointmentParams {
  id: string;
}

interface UpdateAppointmentBody {
  startAt?: string;
  endAt?: string;
  status?: string;
  notes?: string;
}

export const updateAppointment = {
  schema: {
    tags: ["Appointments"],
    summary: "Actualizar cita",
    description: "Actualiza una cita existente",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        startAt: { type: "string", format: "date-time" },
        endAt: { type: "string", format: "date-time" },
        status: { type: "string", enum: ["scheduled", "canceled", "done"] },
        notes: { type: "string" },
      },
    },
    response: {
      200: {
        description: "Cita actualizada exitosamente",
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
      404: {
        description: "Cita no encontrada",
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
      const { id } = request.params as UpdateAppointmentParams;
      const body = request.body as UpdateAppointmentBody;

      const schema = z.object({
        startAt: z.string().datetime().optional(),
        endAt: z.string().datetime().optional(),
        status: z.enum(["scheduled", "canceled", "done"]).optional(),
        notes: z.string().optional(),
      });

      const updateData = schema.parse(body);

      // Verificar que la cita existe
      const existingAppointment =
        await request.server.prisma.appointment.findUnique({
          where: { id },
          include: {
            barber: true,
          },
        });

      if (!existingAppointment) {
        reply.status(404).send({ error: "Appointment not found" });
        return;
      }

      // Si se cambia la fecha/hora, verificar disponibilidad
      if (
        (updateData.startAt || updateData.endAt) &&
        existingAppointment.status !== "canceled"
      ) {
        const startAt = updateData.startAt
          ? new Date(updateData.startAt)
          : existingAppointment.startAt;
        const endAt = updateData.endAt
          ? new Date(updateData.endAt)
          : existingAppointment.endAt;

        const conflictingAppointment =
          await request.server.prisma.appointment.findFirst({
            where: {
              barberId: existingAppointment.barberId,
              id: { not: id },
              OR: [
                {
                  startAt: { lt: endAt },
                  endAt: { gt: startAt },
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

        // Actualizar fechas si pasó la validación
        if (updateData.startAt) updateData.startAt = startAt.toISOString();
        if (updateData.endAt) updateData.endAt = endAt.toISOString();
      }

      // Actualizar la cita
      const appointment = await request.server.prisma.appointment.update({
        where: { id },
        data: updateData,
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

      return appointment;
    } catch (error) {
      console.error("Error updating appointment:", error);
      reply.status(500).send({ error: "Error updating appointment" });
    }
  },
};
