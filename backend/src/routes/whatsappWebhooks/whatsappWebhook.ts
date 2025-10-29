import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { parseWhatsAppMessage } from "../../services/nlp";
import { replyViaTwilio } from "../../services/whatsapp";
import {
  handleBookingIntent,
  handleCancelIntent,
  handleQueryIntent,
} from "./handler";

interface WhatsAppWebhookBody {
  From: string;
  Body: string;
  To?: string;
}

export default async function whatsappWebhookRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/webhook",
    {
      schema: {
        tags: ["whatsapp"],
        summary: "Webhook para recibir mensajes de WhatsApp",
        description:
          "Procesa mensajes entrantes de WhatsApp y responde usando IA",
        consumes: ["application/x-www-form-urlencoded"],
        body: {
          type: "object",
          properties: {
            From: { type: "string" },
            Body: { type: "string" },
            To: { type: "string" },
          },
        },
        response: {
          200: {
            type: "string",
            description: "Respuesta XML para Twilio",
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: WhatsAppWebhookBody }>,
      reply: FastifyReply
    ) => {
      const { From, Body } = request.body;
      fastify.log.info(`📩 Mensaje recibido de ${From}: ${Body}`);

      // ✅ 1. Responder a Twilio inmediatamente (evita reintentos)
      reply
        .type("text/xml")
        .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

      // ⚙️ 2. Procesar el mensaje en background
      setImmediate(async () => {
        try {
          // 🧠 Interpretar mensaje con IA
          const parsedData = await parseWhatsAppMessage(Body);
          fastify.log.info("🧠 Mensaje interpretado:", parsedData);

          // 🤖 Decidir respuesta según intención
          let responseMessage = "";

          if (["book", "reservar"].includes(parsedData.intencion)) {
            responseMessage = await handleBookingIntent(parsedData, From);
          } else if (["cancel", "cancelar"].includes(parsedData.intencion)) {
            responseMessage = await handleCancelIntent(parsedData, From);
          } else if (["query", "consultar"].includes(parsedData.intencion)) {
            responseMessage = await handleQueryIntent(parsedData);
          } else {
            responseMessage =
              "👋 ¡Hola! Soy tu asistente de la barbería.\n" +
              "Puedes decirme por ejemplo:\n" +
              "• Reservar una cita\n" +
              "• Cancelar una cita\n" +
              "• Consultar horarios disponibles";
          }

          // 💬 Enviar respuesta al usuario por WhatsApp
          await replyViaTwilio(From, responseMessage);
        } catch (error) {
          fastify.log.error({ err: error }, "❌ Error procesando mensaje");
          try {
            await replyViaTwilio(
              From,
              "😔 Lo siento, hubo un error procesando tu mensaje. Intenta nuevamente."
            );
          } catch (twilioError) {
            fastify.log.error(
              { err: twilioError },
              "❌ Error enviando mensaje de error por Twilio"
            );
          }
        }
      });
    }
  );
}
