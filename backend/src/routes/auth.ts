import { FastifyInstance, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", async (request, reply) => {
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    });

    const { email, password, name } = registerSchema.parse(request.body);

    const existingBarber = await fastify.prisma.barber.findUnique({
      where: { email },
    });
    if (existingBarber)
      return reply.status(400).send({ error: "Barber already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const barber = await fastify.prisma.barber.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    return {
      id: barber.id,
      email: barber.email,
      name: barber.name,
    };
  });

  fastify.post("/login", async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });
    const { email, password } = loginSchema.parse(request.body);

    const barber = await fastify.prisma.barber.findUnique({
      where: { email },
    });

    if (!barber) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, barber.password);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = fastify.jwt.sign({
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
  });

  fastify.get(
    "/me",
    { preValidation: [fastify.authenticate] },
    async (request: FastifyRequest, reply) => {
      const user = request.user as any;
      const barberId = user.barberId;

      const barber = await fastify.prisma.barber.findUnique({
        where: { id: barberId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!barber) {
        return reply.status(404).send({ error: "Barber not found" });
      }

      return barber;
    }
  );

  fastify.post("/logout", async (request, reply) => {
    return { message: "Logout successful" };
  });
}
