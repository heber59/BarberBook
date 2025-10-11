import { FastifyInstance } from "fastify";

export default async function barbersRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        description: "Get all barbers",
        tags: ["Barbers"],
        response: {
          200: {
            description: "List of barbers",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Aquí se conecta a la base de datos via Prisma
      const barbers = await fastify.prisma.barber.findMany();
      return barbers;
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get a barber by ID",
        tags: ["Barbers"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Barber object",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
          404: { description: "Barber not found" },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const barber = await fastify.prisma.barber.findUnique({ where: { id } });

      if (!barber) {
        reply.code(404);
        return { message: "Barber not found" };
      }

      return barber;
    }
  );
}
