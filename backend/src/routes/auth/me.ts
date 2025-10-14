import { FastifyRequest, FastifyReply } from "fastify";

export const getProfile = {
  schema: {
    tags: ["Auth"],
    summary: "Obtener perfil actual",
    description: "Retorna el perfil del barbero autenticado",
    response: {
      200: {
        description: "Perfil del barbero",
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      401: {
        description: "No autorizado",
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      404: {
        description: "Barbero no encontrado",
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },

  preValidation: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const barberId = (request.user as { barberId: string }).barberId;

      const barber = await request.server.prisma.barber.findUnique({
        where: { id: barberId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!barber) {
        reply.status(404).send({ error: "Barber not found" });
        return;
      }

      return barber;
    } catch (error) {
      console.error("Me endpoint error:", error);
      reply.status(500).send({ error: "Error fetching profile" });
    }
  },
};
