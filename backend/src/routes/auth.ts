import { FastifyInstance } from "fastify";
import authRoutes from "./auth/index";

export default async function authRoutesWrapper(fastify: FastifyInstance) {
  await fastify.register(authRoutes, { prefix: "/api/auth" });
}
