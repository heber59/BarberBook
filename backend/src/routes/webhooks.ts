import { FastifyInstance } from "fastify";
import { parseWhatsAppMessage } from "../services/nlp";
import { replyViaTwilio } from "../services/whatsapp";

export default async function webhooksRoutes(fastify: FastifyInstance) {
  fastify.post("/webhooks/whatsapp", async (request, reply) => {
    const body = request.body as any;
    // Twilio sends `From` and `Body`
    const from = body.From; // e.g. whatsapp:+123...
    const text = body.Body;

    // parse with AI
    const parsed = await parseWhatsAppMessage(text);
    // expected parsed: { intent: "book", phone?: "...", name?: "...", date?: "...", time?: "...", barber?: "..." }

    if (parsed.intent === "book" && parsed.date) {
      // find/create client by phone
      const phone = from.replace("whatsapp:", "");
      const client = await fastify.prisma.client.upsert({
        where: { phone },
        update: { name: parsed.name || undefined },
        create: { name: parsed.name || null, phone },
      });

      // choose barber - either parsed.barber or default
      let barber = null;
      if (parsed.barber) {
        barber = await fastify.prisma.barber.findFirst({
          where: { name: parsed.barber },
        });
      }
      if (!barber) {
        barber = await fastify.prisma.barber.findFirst();
      }

      const start = new Date(parsed.date); // assume ISO or parsed to ISO by NLP
      const end = new Date(start.getTime() + 30 * 60 * 1000); // default 30 min

      const appt = await fastify.prisma.appointment.create({
        data: {
          barberId: barber!.id,
          clientId: client.id,
          startAt: start,
          endAt: end,
          notes: parsed.raw || null,
        },
      });

      await replyViaTwilio(
        from,
        `Turno confirmado para ${start.toLocaleString()} con ${
          barber!.name
        }. ID: ${appt.id}`
      );

      return { ok: true };
    }

    // If other intent, reply accordingly
    await replyViaTwilio(
      from,
      `No entendí tu solicitud. ¿Quieres reservar un turno?`
    );
    return { ok: true };
  });
}
