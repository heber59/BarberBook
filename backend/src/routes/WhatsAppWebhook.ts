import { FastifyInstance } from "fastify";
import whatsappRoutes from "./whatsappWebhooks";

export default async function whatsappRoutesWrapper(fastify: FastifyInstance) {
  await fastify.register(whatsappRoutes, { prefix: "/api/whatsapp" });
}
