import { FastifyInstance } from "fastify";

export default async function barbersRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Barbers"],
        description: "Get all barbers",
        summary: "Obtener todos los barberos",
        response: {
          200: {
            description: "List of barbers",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
          500: {
            description: "Server error",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const barbers = await fastify.prisma.barber.findMany();
        return barbers;
      } catch (error) {
        reply.status(500).send({ error: "Error fetching barbers" });
      }
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Barbers"],
        description: "Get a barber by ID",
        summary: "Obtener barbero por ID",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Barber object",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
            },
          },
          404: { description: "Barber not found" },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const barber = await fastify.prisma.barber.findUnique({ where: { id } });

      if (!barber) {
        reply.code(404);
        return { message: "Barber not found" };
      }

      return barber;
    }
  );
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Barbers"],
        summary: "Crear nuevo barbero",
        description: "Crea un nuevo barbero en el sistema",
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            password: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Barbero creado exitosamente",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Error en los datos",
            type: "object",
            properties: {
              error: { type: "string", example: "Email already exists" },
            },
          },
          500: {
            description: "Server error",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body as {
        name: string;
        email: string;
        password: string;
      };

      try {
        // Verificar si el email ya existe
        const existingBarber = await fastify.prisma.barber.findUnique({
          where: { email },
        });

        if (existingBarber) {
          reply.status(400).send({ error: "Email already exists" });
          return;
        }

        // Crear nuevo barbero (sin hash por simplicidad ahora)
        const barber = await fastify.prisma.barber.create({
          data: {
            name,
            email,
            password, // En producción, esto debería estar hasheado
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });

        reply.status(201).send(barber);
      } catch (error) {
        reply.status(500).send({ error: "Error creating barber" });
      }
    }
  );
}
