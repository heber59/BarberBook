import { FastifyInstance } from "fastify";

export default async function appointmentsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/barbers/:id/appointments",
    {
      schema: {
        description: "Get appointments for a barber",
        tags: ["Barbers"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                startAt: { type: "string" },
                endAt: { type: "string" },
                clientId: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      return await fastify.prisma.appointment.findMany({
        where: { barberId: id },
      });
    }
  );

  fastify.patch("/appointments/:id", async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const appt = await fastify.prisma.appointment.update({
      where: { id },
      data: body,
    });
    return appt;
  });

  fastify.delete("/appointments/:id", async (request, reply) => {
    const { id } = request.params as any;
    await fastify.prisma.appointment.delete({ where: { id } });
    return { ok: true };
  });
}
