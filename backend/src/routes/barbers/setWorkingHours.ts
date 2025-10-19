import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

export const setWorkingHours = {
  schema: {
    tags: ["Barbers"],
    summary: "Configurar horarios de trabajo del barbero",
    description: "Define los horarios de trabajo semanales para un barbero",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      required: ["workingHours"],
      properties: {
        workingHours: {
          type: "array",
          items: {
            type: "object",
            required: ["dayOfWeek", "startTime", "endTime"],
            properties: {
              dayOfWeek: { type: "number", minimum: 0, maximum: 6 },
              startTime: {
                type: "string",
                pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
              },
              endTime: {
                type: "string",
                pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
              },
            },
          },
        },
      },
    },
    response: {
      200: {
        description: "Horarios configurados exitosamente",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          workingHours: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                dayOfWeek: { type: "number" },
                startTime: { type: "string" },
                endTime: { type: "string" },
                isActive: { type: "boolean" },
              },
            },
          },
        },
      },
      400: {
        description: "Error en los datos",
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
    try {
      const paramsSchema = z.object({
        id: z.string(),
      });

      const bodySchema = z.object({
        workingHours: z.array(
          z.object({
            dayOfWeek: z.number().min(0).max(6),
            startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          })
        ),
      });

      const { id } = paramsSchema.parse(request.params);
      const { workingHours } = bodySchema.parse(request.body);

      // Verificar que el barbero existe
      const barber = await request.server.prisma.barber.findUnique({
        where: { id },
      });

      if (!barber) {
        reply.status(404).send({ error: "Barbero no encontrado" });
        return;
      }

      // Eliminar horarios existentes
      await request.server.prisma.barberWorkingHours.deleteMany({
        where: { barberId: id },
      });

      // Crear nuevos horarios
      const createdWorkingHours =
        await request.server.prisma.barberWorkingHours.createMany({
          data: workingHours.map((wh) => ({
            barberId: id,
            dayOfWeek: wh.dayOfWeek,
            startTime: wh.startTime,
            endTime: wh.endTime,
            isActive: true,
          })),
        });

      const barberWorkingHours =
        await request.server.prisma.barberWorkingHours.findMany({
          where: { barberId: id },
          orderBy: { dayOfWeek: "asc" },
        });

      return {
        success: true,
        message: "Horarios de trabajo configurados exitosamente",
        workingHours: barberWorkingHours,
      };
    } catch (error) {
      console.error("Error setting working hours:", error);
      reply
        .status(500)
        .send({ error: "Error configurando horarios de trabajo" });
    }
  },
};
