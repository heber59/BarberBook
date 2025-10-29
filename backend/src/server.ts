import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma";
import barbersRoutes from "./routes/barbers";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import authRoutes from "./routes/auth";
import jwtPlugin from "./plugins/jwt";
import appointmentsRoutes from "./routes/appointments";
import aiAgentRoutes from "./routes/aiAgent";
import whatsappRoutesWrapper from "./routes/WhatsAppWebhook";
import formbody from "@fastify/formbody";

const fastify = Fastify({
  logger: true,
});

const start = async () => {
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "BarberBook API",
        description: "API para sistema de gestión de barberías",
        version: "1.0.0",
      },
      host: "localhost:4000",
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        { name: "Auth", description: "Endpoints de autenticación" },
        { name: "Barbers", description: "Endpoints de barberos" },
        { name: "Appointments", description: "Endpoints de citas" },
        { name: "AI Agent", description: "Endpoints del agente de IA" },
        { name: "whatsapp", description: "Endpoints de whatsapp" },
      ],
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });

  await fastify.register(prismaPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(formbody);
  await fastify.register(barbersRoutes, { prefix: "" });
  await fastify.register(authRoutes, { prefix: "" });
  await fastify.register(appointmentsRoutes, { prefix: "" });
  await fastify.register(aiAgentRoutes, { prefix: "" });
  await fastify.register(whatsappRoutesWrapper, { prefix: "" });

  fastify.get("/", async (request, reply) => {
    return {
      message: "BarberBook API",
      status: "running",
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get("/health", async (request, reply) => {
    return {
      status: "OK",
      service: "barber-backend",
      timestamp: new Date().toISOString(),
    };
  });

  try {
    await fastify.listen({
      port: 4000,
      host: "0.0.0.0",
    });
    console.log("Server running on http://0.0.0.0:4000");
    console.log("📚 Documentation available at http://localhost:4000/docs");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
