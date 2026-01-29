import { NextResponse } from "next/server";

type Car = {
  year: number;
  make: string;
  model: string;
  price: number;
  km: number;
  vin: string;
  bodyType?: "SUV" | "Sedan" | "Truck" | "Hatch";
};

// 🔥 Inventario demo (incluye Honda)
const INVENTORY: Car[] = [
  { year: 2020, make: "Toyota", model: "RAV4", price: 24999, km: 82000, vin: "VIN123", bodyType: "SUV" },
  { year: 2019, make: "Toyota", model: "Corolla", price: 17999, km: 60000, vin: "VIN456", bodyType: "Sedan" },
  { year: 2021, make: "Honda", model: "CR-V", price: 26999, km: 40000, vin: "VIN789", bodyType: "SUV" },
];

function parseUserIntent(message: string) {
  const text = message.toLowerCase();

  // Marca
  let make: string | null = null;
  if (text.includes("toyota")) make = "Toyota";
  if (text.includes("honda")) make = "Honda";
  if (text.includes("ford")) make = "Ford"; // para probar “no hay resultados”

  // Tipo
  let bodyType: Car["bodyType"] | null = null;
  if (text.includes("suv")) bodyType = "SUV";
  if (text.includes("sedan")) bodyType = "Sedan";
  if (text.includes("truck") || text.includes("pickup")) bodyType = "Truck";

  // Precio máximo (ej: 22k, 25000, 25 mil)
  let maxPrice: number | null = null;
  const kMatch = text.match(/(\d+)\s*k/); // 22k
  if (kMatch) maxPrice = Number(kMatch[1]) * 1000;

  const priceMatch = text.match(/(\d{2,6})/); // 25000
  if (!maxPrice && priceMatch) {
    const n = Number(priceMatch[1]);
    if (n >= 1000) maxPrice = n;
  }

  // Kilometraje máximo (ej: 90 mil, 90000)
  let maxKm: number | null = null;
  const kmK = text.match(/(\d+)\s*mil\s*km/); // 90 mil km
  if (kmK) maxKm = Number(kmK[1]) * 1000;

  const kmRaw = text.match(/(\d{2,6})\s*km/); // 90000 km
  if (!maxKm && kmRaw) maxKm = Number(kmRaw[1]);

  return { make, bodyType, maxPrice, maxKm };
}

function filterInventory(inv: Car[], intent: ReturnType<typeof parseUserIntent>) {
  return inv.filter((c) => {
    if (intent.make && c.make !== intent.make) return false;
    if (intent.bodyType && c.bodyType !== intent.bodyType) return false;
    if (intent.maxPrice !== null && c.price > intent.maxPrice) return false;
    if (intent.maxKm !== null && c.km > intent.maxKm) return false;
    return true;
  });
}

export async function POST(req: Request) {
  const { message } = await req.json();
  const intent = parseUserIntent(String(message ?? ""));

  const results = filterInventory(INVENTORY, intent);

  if (results.length === 0) {
    return NextResponse.json({
      answer: `No encontré autos con esos criterios 😕\n\nTip: prueba “SUV Honda bajo 30k” o “Toyota menos de 90 mil km”.`,
      inventory: [],
      debug: { intent }, // 👈 útil para ti (luego lo quitas)
    });
  }

  const answerLines = results.map(
    (c) => `- ${c.year} ${c.make} ${c.model} $${c.price} (${c.km} km) VIN:${c.vin}`
  );

  return NextResponse.json({
    answer:
      `Encontré estos autos:\n${answerLines.join("\n")}\n\n¿Quieres filtrar por precio, año o kilometraje?`,
    inventory: results,
    debug: { intent }, // 👈 útil para ti (luego lo quitas)
  });
}
