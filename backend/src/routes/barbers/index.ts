import { FastifyInstance } from "fastify";
import { getBarbers } from "./getBarbers";
import { deleteBarber } from "./deleteBarber";
import { updatePassword } from "./updatePassword";
import { setWorkingHours } from "./setWorkingHours";

export default async function barbersRoutes(fastify: FastifyInstance) {
  fastify.get("/", getBarbers);

  fastify.delete("/:id", deleteBarber);

  fastify.post("/:id/working-hours", setWorkingHours);

  fastify.patch("/:id/password", updatePassword);
}
