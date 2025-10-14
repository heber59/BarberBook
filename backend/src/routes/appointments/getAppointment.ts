import { FastifyRequest, FastifyReply } from "fastify";

interface GetAppointmentsQuery {
  barberId?: string;
  clientPhone?: string;
  date?: string;
  status?: string;
}

export const getAppointments = {
  schema: {
    tags: ["Appointments"],
    summary: "Obtener citas",
    description: "Obtiene citas con filtros opcionales",
    querystring: {
      type: "object",
      properties: {
        barberId: { type: "string" },
        clientPhone: { type: "string" },
        date: { type: "string", format: "date" },
        status: { type: "string" },
      },
    },
    response: {
      200: {
        description: "Lista de citas",
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            barber: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
            client: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                phone: { type: "string" },
              },
            },
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            status: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
    },
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { barberId, clientPhone, date, status } =
        request.query as GetAppointmentsQuery;

      const where: any = {};

      if (barberId) where.barberId = barberId;
      if (status) where.status = status;

      if (clientPhone) {
        where.client = { phone: clientPhone };
      }

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        where.startAt = {
          gte: startDate,
          lt: endDate,
        };
      }

      const appointments = await request.server.prisma.appointment.findMany({
        where,
        include: {
          barber: {
            select: {
              id: true,
              name: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          startAt: "asc",
        },
      });

      return appointments;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      reply.status(500).send({ error: "Error fetching appointments" });
    }
  },
};
