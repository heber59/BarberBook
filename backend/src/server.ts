import fastify from "fastify";
import cors from "@fastify/cors";
import staticPlugin from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import path from "path";
import dotenv from "dotenv";

import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";
import barbersRoutes from "./routes/barbers";
import authRoutes from "./routes/auth";

dotenv.config();

const server = fastify({ logger: true });

// Plugins
server.register(cors, { origin: "*" });
server.register(prismaPlugin);
server.register(jwtPlugin);

// Servir archivos estáticos **antes de las rutas**
server.register(staticPlugin, {
  root: path.join(__dirname, "public"), // src/public
  prefix: "/", // accesible directamente
  index: true, // habilita index.html automáticamente
});

// Rutas
server.register(barbersRoutes, { prefix: "/barber" });
server.register(authRoutes, { prefix: "/auth" });

// Swagger/OpenAPI
server.register(swagger, {
  swagger: {
    info: { title: "BarberBook API", version: "1.0.0" },
    consumes: ["application/json"],
    produces: ["application/json"],
  },
});

server.register(swaggerUI, {
  routePrefix: "/documentation",
  uiConfig: { docExpansion: "list" },
  staticCSP: true,
  transformSpecification: (swaggerObject) => swaggerObject,
});

// No necesitas un get("/") manual si index: true está activo
// server.get("/", async (request, reply) => {
//   return reply.sendFile("index.html");
// });

// Start server
const start = async () => {
  try {
    await server.listen({
      port: Number(process.env.PORT) || 4000,
      host: "0.0.0.0",
    });
    console.log("Server running at http://0.0.0.0:4000");
    console.log("Open http://localhost:4000/ to see docs");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
