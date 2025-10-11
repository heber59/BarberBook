import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

export default async function authRoutes(fastify: FastifyInstance) {
  // Registro
  fastify.post("/register", async (request, reply) => {
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    });

    const { email, password, name } = registerSchema.parse(request.body);

    const existingUser = await fastify.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser)
      return reply.status(400).send({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await fastify.prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    return { id: user.id, email: user.email, name: user.name };
  });

  // Login
  fastify.post("/login", async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });
    const { email, password } = loginSchema.parse(request.body);

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(401).send({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.status(401).send({ error: "Invalid credentials" });

    const token = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: "1h" }
    );

    return { token };
  });

  // Ruta protegida
  fastify.get(
    "/me",
    { preValidation: [fastify.authenticate] },
    async (request) => {
      const userId = request.user.userId; // TS ya reconoce que request.user es JwtPayload

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });
      return user;
    }
  );
}
