// src/plugins/prisma.ts
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

export default fp(async (fastify, opts) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  // Decoramos Fastify con Prisma
  fastify.decorate("prisma", prisma);

  // Cierre limpio al detener el servidor
  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});

// Tipado para TypeScript
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
