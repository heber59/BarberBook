import { FastifyRequest, FastifyReply } from "fastify";

export const getBarbers = {
  schema: {
    tags: ["Barbers"],
    description: "Get all barbers",
    summary: "Obtener todos los barberos",
    response: {
      200: {
        description: "List of barbers",
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
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
      const barbers = await request.server.prisma.barber.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
      return barbers;
    } catch (error) {
      console.error("Error fetching barbers:", error);
      reply.status(500).send({ error: "Error fetching barbers" });
    }
  },
};
