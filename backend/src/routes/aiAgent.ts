import { FastifyInstance } from "fastify";
import aiAgentRoutes from "./aiAgent/index";

export default async function aiAgentRoutesWrapper(fastify: FastifyInstance) {
  await fastify.register(aiAgentRoutes, { prefix: "/api/ai" });
}
