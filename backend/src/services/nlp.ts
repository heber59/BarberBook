import axios from "axios";

export async function parseWhatsAppMessage(text: string) {
  // Call OpenAI to extract structured data: intent, date/time, barber (if any), service type
  const prompt = `
  Extrae en JSON el nombre del cliente (si aparece), phone (si aplica), 
  intención (book/cancel/query), fecha y hora en formato ISO (si aparece), nombre de barbero (si menciona)
  del siguiente mensaje: "${text}"
  Devuelve solo JSON.
  `;

  const resp = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    }
  );

  const content = resp.data.choices?.[0]?.message?.content;
  // intentar parsear JSON
  try {
    return JSON.parse(content);
  } catch (err) {
    return { raw: text };
  }
}
