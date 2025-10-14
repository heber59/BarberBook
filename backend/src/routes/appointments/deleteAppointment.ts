import { FastifyRequest, FastifyReply } from "fastify";

interface DeleteAppointmentParams {
  id: string;
}

export const deleteAppointment = {
  schema: {
    tags: ["Appointments"],
    summary: "Eliminar cita",
    description: "Elimina una cita existente",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        description: "Cita eliminada exitosamente",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          deletedAppointment: {
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
            },
          },
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
      const { id } = request.params as DeleteAppointmentParams;

      // Verificar que la cita existe
      const existingAppointment =
        await request.server.prisma.appointment.findUnique({
          where: { id },
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

      if (!existingAppointment) {
        reply.status(404).send({ error: "Appointment not found" });
        return;
      }

      await request.server.prisma.appointment.delete({
        where: { id },
      });

      return {
        success: true,
        message: "Appointment deleted successfully",
        deletedAppointment: existingAppointment,
      };
    } catch (error) {
      console.error("Error deleting appointment:", error);
      reply.status(500).send({ error: "Error deleting appointment" });
    }
  },
};
