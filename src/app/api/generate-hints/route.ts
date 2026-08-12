import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  console.log("=== POST HANDLER INVOKED ===");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { name, category, address, phone, reason } = body as {
    name?: string;
    category?: string | null;
    address?: string;
    phone?: string | null;
    reason?: string;
  };

  if (!name || !reason) {
    return NextResponse.json({ error: "Dati insufficienti." }, { status: 400 });
  }

  const reasonLabel =
    reason === "no_website"
      ? "assenza totale di sito web"
      : "sito web irraggiungibile o non funzionante";

  const details = [
    category ? `Categoria: ${category}` : null,
    address  ? `Zona/indirizzo: ${address}` : null,
    phone    ? `Telefono disponibile: sì` : `Telefono disponibile: no`,
    `Motivo rilevamento: ${reasonLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "user",
          content: `Sei un consulente commerciale che aiuta piccole agenzie a scrivere mail di primo contatto a imprenditori locali italiani. Ti vengono dati i dati di un'attività identificata come potenziale cliente per via della sua ${reasonLabel}.

Dati attività:
Nome: ${name}
${details}

Genera esattamente 3-4 bullet point da usare come agganci specifici per questa attività in una mail di primo contatto. Ogni punto deve:
- essere concreto e specifico a questa attività (settore, zona, situazione web)
- essere uno spunto da sviluppare, NON una frase pronta da copiare in mail
- essere massimo 15-20 parole
- essere in italiano

NON includere testo introduttivo, conclusioni, numerazione o trattini. Scrivi solo i punti, uno per riga.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    console.log("=== FULL MESSAGE OBJECT ===", JSON.stringify(message, null, 2));
    const hints = text
      .split("\n")
      .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);

    if (hints.length === 0) {
      return NextResponse.json(
        { error: "Generazione non riuscita, riprova." },
        { status: 500 }
      );
    }

    return NextResponse.json({ hints });
  } catch (err) {
    console.log("=== GENERATE HINTS ERROR ===", JSON.stringify(err, null, 2));
    console.error("generate-hints: Anthropic API error:", err);
    return NextResponse.json(
      { error: "Generazione non riuscita, riprova." },
      { status: 500 }
    );
  }
}
