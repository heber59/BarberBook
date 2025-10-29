import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function whatsappTestRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/test",
    {
      schema: {
        tags: ["whatsapp"],
        summary: "Probar webhook de WhatsApp manualmente",
        body: {
          type: "object",
          required: ["phone", "message"],
          properties: {
            phone: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { phone: string; message: string } }>,
      reply: FastifyReply
    ) => {
      const { phone, message } = request.body;

      const mockPayload = {
        From: phone,
        Body: message,
      };

      const response = await fastify.inject({
        method: "POST",
        url: "/api/whatsapp/webhook",
        payload: new URLSearchParams(mockPayload as any).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return {
        success: true,
        status: response.statusCode,
        message: "Webhook probado exitosamente",
        testData: {
          from: phone,
          message: message,
          response: response.payload,
        },
      };
    }
  );
}
