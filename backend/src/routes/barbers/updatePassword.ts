import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";

interface UpdatePasswordParams {
  id: string;
}

interface UpdatePasswordBody {
  newPassword: string;
}

export const updatePassword = {
  schema: {
    tags: ["Barbers"],
    summary: "Actualizar contraseña del barbero",
    description: "Actualiza la contraseña de un barbero específico",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      required: ["newPassword"],
      properties: {
        newPassword: { type: "string", minLength: 6 },
      },
    },
    response: {
      200: {
        description: "Contraseña actualizada exitosamente",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      400: {
        description: "Contraseña demasiado corta",
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
    const { id } = request.params as UpdatePasswordParams;
    const { newPassword } = request.body as UpdatePasswordBody;

    try {
      const existingBarber = await request.server.prisma.barber.findUnique({
        where: { id },
      });

      if (!existingBarber) {
        reply.status(404).send({ error: "Barber not found" });
        return;
      }

      if (newPassword.length < 6) {
        reply
          .status(400)
          .send({ error: "Password must be at least 6 characters long" });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await request.server.prisma.barber.update({
        where: { id },
        data: {
          password: hashedPassword,
        },
      });

      return {
        success: true,
        message: "Password updated successfully",
      };
    } catch (error) {
      console.error("Error updating password:", error);
      reply.status(500).send({ error: "Error updating password" });
    }
  },
};
