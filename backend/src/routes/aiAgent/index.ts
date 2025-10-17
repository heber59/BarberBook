import { FastifyInstance } from "fastify";
import { handleAIChat } from "./handleAIChat";

import { confirmAppointment } from "./confirmAppointment";
import { getAvailableSlotsHandler } from "./getAvaliableSlot";

export default async function aiAgentRoutes(fastify: FastifyInstance) {
  fastify.post("/chat", handleAIChat);
  fastify.get("/available-slots", getAvailableSlotsHandler);
  fastify.post("/confirm-appointment", confirmAppointment);
}
