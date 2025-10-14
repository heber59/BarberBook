import { FastifyInstance } from "fastify";
import appointmentsRoutes from "./appointments/index";

export default async function appointmentsRoutesWrapper(
  fastify: FastifyInstance
) {
  await fastify.register(appointmentsRoutes, { prefix: "/api/appointments" });
}
