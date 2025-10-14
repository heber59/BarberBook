import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface JwtPayload {
  barberId: string;
  email: string | null;
  name: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: JwtPayload;
  }
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fjwt, {
    secret: process.env.JWT_SECRET || "supersecret",
  });

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
