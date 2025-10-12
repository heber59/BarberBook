// src/plugins/jwt.ts
import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface JwtPayload {
  barberId: string;
  email: string | null;
  name: string;
}

// Extender FastifyRequest
declare module "fastify" {
  interface FastifyRequest {
    user: JwtPayload;
  }
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

// Extender @fastify/jwt
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  // Registrar el plugin JWT correctamente
  await fastify.register(fjwt, {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  // Decorar el método authenticate
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: "Unauthorized" });
      }
    }
  );
});