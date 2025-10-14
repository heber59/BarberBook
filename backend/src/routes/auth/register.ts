import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export const registerBarber = {
  schema: {
    tags: ["Auth"],
    summary: "Registrar nuevo barbero",
    description: "Crea una nueva cuenta de barbero en el sistema",
    body: {
      type: "object",
      required: ["email", "password", "name"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
        name: { type: "string", minLength: 1 },
      },
    },
    response: {
      201: {
        description: "Barbero registrado exitosamente",
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      400: {
        description: "Error en los datos",
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
      const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      });

      const { email, password, name } = registerSchema.parse(request.body);

      const existingBarber = await request.server.prisma.barber.findUnique({
        where: { email },
      });

      if (existingBarber) {
        reply.status(400).send({ error: "Barber already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const barber = await request.server.prisma.barber.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      reply.status(201).send(barber);
    } catch (error) {
      console.error("Register error:", error);
      reply.status(500).send({ error: "Error during registration" });
    }
  },
};
