import { FastifyInstance } from "fastify";
import { registerBarber } from "./register";
import { loginBarber } from "./login";
import { getProfile } from "./me";
import { logoutBarber } from "./logout";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", registerBarber);

  fastify.post("/login", loginBarber);

  fastify.get("/me", getProfile);

  fastify.post("/logout", logoutBarber);
}
