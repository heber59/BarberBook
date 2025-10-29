import { FastifyInstance } from "fastify";
import whatsappWebhookRoutes from "./whatsappWebhook";
import whatsappTestRoutes from "./whatsappTest";

export default async function whatsappRoutes(fastify: FastifyInstance) {
  await fastify.register(whatsappWebhookRoutes);
  await fastify.register(whatsappTestRoutes);
}
