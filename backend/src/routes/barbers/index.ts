import { FastifyInstance } from "fastify";
import { getBarbers } from "./getBarbers";
import { createBarber } from "./createBarbers";
import { deleteBarber } from "./deleteBarbers";
import { updatePassword } from "./updatePassword";

export default async function barbersRoutes(fastify: FastifyInstance) {
  fastify.get("/", getBarbers);

  fastify.post("/", createBarber);

  fastify.delete("/:id", deleteBarber);

  fastify.patch("/:id/password", updatePassword);
}
