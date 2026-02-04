import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL!;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY!;

// --- helper: llama a Scriptcase ---
async function fetchFromBackend(endpoint: string) {
  const res = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${BACKEND_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Error consultando backend de pólizas");
  }

  return res.json();
}

export async function POST(req: Request) {
  return NextResponse.json({
  answer: "TEST OK — endpoint /api/chat está funcionando",
});
  try {
    const { message } = await req.json();

    // 1️⃣ OpenAI SOLO para entender intención
    const intentResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Eres un clasificador de intención para un agente de seguros.
NO respondas al usuario.
SOLO devuelve JSON con:
{
  "intent": "vigencia | deducible | cobertura | siniestro | responsabilidad_civil | desconocido"
}
          `,
        },
        { role: "user", content: message },
      ],
      temperature: 0,
    });

    const intent = JSON.parse(
      intentResponse.choices[0].message.content || "{}"
    ).intent;

    // 2️⃣ Decide qué endpoint consultar
    let data;
    switch (intent) {
      case "vigencia":
        data = await fetchFromBackend("/poliza/vigencia");
        break;
      case "deducible":
        data = await fetchFromBackend("/poliza/deducible");
        break;
      case "cobertura":
        data = await fetchFromBackend("/poliza/coberturas");
        break;
      case "siniestro":
        data = await fetchFromBackend("/poliza/siniestro");
        break;
      case "responsabilidad_civil":
        data = await fetchFromBackend("/poliza/responsabilidad-civil");
        break;
      default:
        return NextResponse.json({
          answer:
            "Puedo ayudarte con vigencia, deducibles, coberturas o cómo reportar un siniestro 🙂",
        });
    }

    // 3️⃣ OpenAI SOLO para redactar claro (NO inventar)
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Eres un asistente de seguros.
Usa ÚNICAMENTE la información proporcionada.
Agrega siempre este aviso:

"Aviso: Esta información es solo una guía. Valida siempre con tu póliza oficial o con un asesor autorizado."
          `,
        },
        {
          role: "user",
          content: `
Información de backend:
${JSON.stringify(data)}

Pregunta del usuario:
${message}
          `,
        },
      ],
      temperature: 0.2,
    });

    return NextResponse.json({
      answer: finalResponse.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { answer: "Ocurrió un error procesando tu consulta 😕" },
      { status: 500 }
    );
  }
}
