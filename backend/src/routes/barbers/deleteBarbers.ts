import { FastifyRequest, FastifyReply } from "fastify";

interface DeleteBarberParams {
  id: string;
}

export const deleteBarber = {
  schema: {
    tags: ["Barbers"],
    summary: "Eliminar barbero por ID",
    description: "Elimina un barbero específico por su ID",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        description: "Barbero eliminado exitosamente",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          deletedBarber: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
      404: {
        description: "Barbero no encontrado",
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
    const { id } = request.params as DeleteBarberParams;

    try {
      const existingBarber = await request.server.prisma.barber.findUnique({
        where: { id },
      });

      if (!existingBarber) {
        reply.status(404).send({ error: "Barber not found" });
        return;
      }

      const deletedBarber = await request.server.prisma.barber.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return {
        success: true,
        message: "Barber deleted successfully",
        deletedBarber,
      };
    } catch (error) {
      console.error("Error deleting barber:", error);
      reply.status(500).send({ error: "Error deleting barber" });
    }
  },
};
