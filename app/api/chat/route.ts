import { NextResponse } from "next/server";
import OpenAI from "openai";

// 🧠 Inicializamos OpenAI con tu API Key (desde Vercel)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🚗 Inventario MOCK (por ahora)
// Luego lo conectamos a MySQL 🗄️
const INVENTORY = [
  { year: 2020, make: "Toyota", model: "RAV4", price: 24999, km: 82000, vin: "VIN123" },
  { year: 2019, make: "Toyota", model: "Corolla", price: 17999, km: 60000, vin: "VIN456" },
  { year: 2021, make: "Honda", model: "CR-V", price: 26999, km: 40000, vin: "VIN789" },
];

// 🧠 Esta función es el "cerebro"
// Traduce texto humano → filtros estructurados
async function extractFilters(message: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Eres un asistente que convierte mensajes de clientes en filtros de autos.
Devuelve SOLO JSON válido con estas posibles claves:
make, model, maxPrice, minPrice, maxKm, minYear, maxYear.
Si algo no se menciona, omítelo.
        `,
      },
      {
        role: "user",
        content: message,
      },
    ],
    temperature: 0,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

// 🚀 Endpoint POST /api/chat
export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1️⃣ IA entiende el mensaje
    const filters = await extractFilters(message);

    // 2️⃣ Aplicamos filtros al inventario
    const results = INVENTORY.filter((car) => {
      if (filters.make && car.make.toLowerCase() !== filters.make.toLowerCase()) return false;
      if (filters.maxPrice && car.price > filters.maxPrice) return false;
      if (filters.minPrice && car.price < filters.minPrice) return false;
      if (filters.maxKm && car.km > filters.maxKm) return false;
      if (filters.minYear && car.year < filters.minYear) return false;
      if (filters.maxYear && car.year > filters.maxYear) return false;
      return true;
    });

    // 3️⃣ Respuesta humana
    let answer = "No encontré autos con esos criterios 😕";
    if (results.length > 0) {
      answer =
        "Encontré estos autos:\n" +
        results
          .map(
            (c) =>
              `- ${c.year} ${c.make} ${c.model} $${c.price} (${c.km} km) VIN:${c.vin}`
          )
          .join("\n") +
        "\n\n¿Quieres filtrar por precio, año o kilometraje?";
    }

    return NextResponse.json({
      answer,
      filtersUsed: filters,
      inventory: results,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error procesando el mensaje" },
      { status: 500 }
    );
  }
}
