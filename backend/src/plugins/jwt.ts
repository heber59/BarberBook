// src/plugins/jwt.ts
import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface JwtPayload {
  userId: string;
  email: string;
}

// Extendemos FastifyRequest y FastifyInstance con TypeScript
declare module "fastify" {
  interface FastifyRequest {
    user: JwtPayload;
  }
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(require("@fastify/jwt"), {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify<JwtPayload>();
      } catch (err) {
        reply.send(err);
      }
    }
  );
});
