"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ who: "you" | "bot"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const msg = input.trim();
    if (!msg) return;

    // 1️⃣ Mostrar lo que escribió el usuario
    setMessages((m) => [...m, { who: "you", text: msg }]);
    setInput("");
    setLoading(true);

    // 2️⃣ Mandar al "cerebro"
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });

    // 3️⃣ Leer respuesta
    const data = await res.json();

    // 4️⃣ Mostrar respuesta del bot
    setMessages((m) => [...m, { who: "bot", text: data.answer }]);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Rulox Chat 💬</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, minHeight: 320 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "10px 0", whiteSpace: "pre-wrap" }}>
            <b>{m.who === "you" ? "Tú" : "Rulox"}:</b> {m.text}
          </div>
        ))}
        {loading && <div><b>Rulox:</b> pensando…</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: SUVs bajo 25k"
          style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
        />
        <button
          onClick={send}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          Enviar
        </button>
      </div>
    </main>
  );
}