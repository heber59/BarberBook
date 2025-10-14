import { FastifyInstance } from "fastify";
import { createAppointment } from "./createAppointment";
import { getAppointments } from "./getAppointment";
import { updateAppointment } from "./updateAppointment";
import { deleteAppointment } from "./deleteAppointment";

export default async function appointmentsRoutes(fastify: FastifyInstance) {
  fastify.post("/", createAppointment);

  fastify.get("/", getAppointments);

  fastify.patch("/:id", updateAppointment);

  fastify.delete("/:id", deleteAppointment);
}
