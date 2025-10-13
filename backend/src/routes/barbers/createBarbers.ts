import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";

interface CreateBarberBody {
  name: string;
  email: string;
  password: string;
}

export const createBarber = {
  schema: {
    tags: ["Barbers"],
    summary: "Crear nuevo barbero",
    description: "Crea un nuevo barbero en el sistema",
    body: {
      type: "object",
      required: ["name", "email", "password"],
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        password: { type: "string", minLength: 6 },
      },
    },
    response: {
      201: {
        description: "Barbero creado exitosamente",
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
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
    const { name, email, password } = request.body as CreateBarberBody;

    try {
      // Validar longitud de contraseña
      if (password.length < 6) {
        reply.status(400).send({ error: "Password must be at least 6 characters long" });
        return;
      }

      const existingBarber = await request.server.prisma.barber.findUnique({
        where: { email },
      });

      if (existingBarber) {
        reply.status(400).send({ error: "Email already exists" });
        return;
      }

      // Hashear la contraseña antes de guardar
      const hashedPassword = await bcrypt.hash(password, 10);

      const barber = await request.server.prisma.barber.create({
        data: {
          name,
          email,
          password: hashedPassword, 
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      reply.status(201).send(barber);
    } catch (error) {
      console.error("Error creating barber:", error);
      reply.status(500).send({ error: "Error creating barber" });
    }
  },
};