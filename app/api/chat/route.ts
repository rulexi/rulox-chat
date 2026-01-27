import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1️⃣ Leemos el mensaje del usuario
  const body = await req.json();
  const userMessage = (body.message || "").trim();

  // 2️⃣ Si no escribió nada, respondemos amable
  if (!userMessage) {
    return NextResponse.json({
      answer: "Escribe una pregunta 🙂",
      inventory: [],
    });
  }

  // 3️⃣ Inventario de prueba (dummy)
  const inventory = [
    { year: 2020, make: "Toyota", model: "RAV4", price: 24999, km: 82000, vin: "VIN123" },
    { year: 2019, make: "Toyota", model: "Corolla", price: 17999, km: 60000, vin: "VIN456" },
  ];

  // 4️⃣ Construimos la respuesta
  const answer =
    "Encontré estos autos:\n" +
    inventory
      .map(
        (v) =>
          `- ${v.year} ${v.make} ${v.model} $${v.price} (${v.km} km) VIN:${v.vin}`
      )
      .join("\n") +
    "\n\n¿Quieres filtrar por precio, año o kilometraje?";

  // 5️⃣ Respondemos al frontend
  return NextResponse.json({ answer, inventory });
}