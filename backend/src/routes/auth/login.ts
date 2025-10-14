import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

interface LoginBody {
  email: string;
  password: string;
}

export const loginBarber = {
  schema: {
    tags: ["Auth"],
    summary: "Login de barbero",
    description: "Autentica un barbero y retorna un token JWT",
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string" },
      },
    },
    response: {
      200: {
        description: "Login exitoso",
        type: "object",
        properties: {
          token: { type: "string" },
          barber: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
      401: {
        description: "Credenciales inválidas",
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
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string(),
      });

      const { email, password } = loginSchema.parse(request.body);

      const barber = await request.server.prisma.barber.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
        },
      });

      if (!barber) {
        reply.status(401).send({ error: "Invalid credentials" });
        return;
      }

      const valid = await bcrypt.compare(password, barber.password);
      if (!valid) {
        reply.status(401).send({ error: "Invalid credentials" });
        return;
      }

      const token = request.server.jwt.sign({
        barberId: barber.id,
        email: barber.email,
        name: barber.name,
      });

      return {
        token,
        barber: {
          id: barber.id,
          email: barber.email,
          name: barber.name,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      reply.status(500).send({ error: "Error during login" });
    }
  },
};
