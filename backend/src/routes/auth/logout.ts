import { FastifyRequest, FastifyReply } from "fastify";

export const logoutBarber = {
  schema: {
    tags: ["Auth"],
    summary: "Logout",
    description: "Cierra la sesión del barbero",
    response: {
      200: {
        description: "Logout exitoso",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    return { message: "Logout successful" };
  },
};
