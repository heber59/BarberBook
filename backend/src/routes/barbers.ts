import { FastifyInstance } from "fastify";
import barbersRoutes from "./barbers/index";

export default async function barbersRoutesWrapper(fastify: FastifyInstance) {
  await fastify.register(barbersRoutes, { prefix: "/api/barbers" });
}
