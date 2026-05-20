import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
export function anthropic() {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY fehlt");
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

export const MODEL = "claude-sonnet-4-6";

export type PlanAnalysis = {
  summary: string;
  schedule: Array<{
    grade: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }>;
  recommendedTrips: Array<{
    direction: "HIN" | "RUECK";
    dayOfWeek: string;
    time: string;
    rationale: string;
  }>;
};

export type PlanInput =
  | { kind: "text"; text: string }
  | { kind: "pdf"; base64: string }
  | { kind: "image"; base64: string; mediaType: string };

const SYSTEM_PROMPT = `Du bist Assistent der Gemeinde Wiliberg (AG, Schweiz). Du analysierst Schulpläne / Stundenpläne und schlägst Schulbus-Fahrzeiten vor.
Antworte AUSSCHLIESSLICH mit gültigem JSON nach folgendem Schema:
{
  "summary": "Kurzfassung in Deutsch",
  "schedule": [{"grade":"...","dayOfWeek":"Mo","startTime":"HH:MM","endTime":"HH:MM","notes":"..."}],
  "recommendedTrips": [{"direction":"HIN"|"RUECK","dayOfWeek":"Mo","time":"HH:MM","rationale":"..."}]
}
Empfohlene Hin-Fahrten ca. 20 Min. vor Unterrichtsbeginn, Rück-Fahrten ca. 10 Min. nach Unterrichtsende. Falls Informationen unklar sind, kennzeichne dies im notes-Feld.`;

export async function analysePlan(
  school: string,
  input: PlanInput
): Promise<{ analysis: PlanAnalysis; extractedText: string }> {
  const userContent: Anthropic.Messages.ContentBlockParam[] = [];
  if (input.kind === "text") {
    userContent.push({
      type: "text",
      text: `Schule: ${school}\n\nSchulplan (Rohtext):\n${input.text.slice(
        0,
        50000
      )}\n\nBitte analysiere und gib JSON zurück.`,
    });
  } else if (input.kind === "pdf") {
    userContent.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: input.base64,
      },
    });
    userContent.push({
      type: "text",
      text: `Schule: ${school}\n\nBitte analysiere das angehängte PDF und gib JSON zurück.`,
    });
  } else {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.mediaType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: input.base64,
      },
    });
    userContent.push({
      type: "text",
      text: `Schule: ${school}\n\nBitte analysiere das angehängte Bild des Stundenplans und gib JSON zurück.`,
    });
  }

  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("KI-Antwort enthielt kein JSON");
  const analysis = JSON.parse(match[0]) as PlanAnalysis;

  let extractedText = "";
  if (input.kind === "text") {
    extractedText = input.text;
  } else {
    extractedText = `[Aus ${
      input.kind === "pdf" ? "PDF" : "Bild"
    } extrahiert]\n\n${analysis.summary}\n\nUnterrichtszeiten:\n${analysis.schedule
      .map(
        (s) =>
          `${s.grade} · ${s.dayOfWeek} ${s.startTime}-${s.endTime}${
            s.notes ? " (" + s.notes + ")" : ""
          }`
      )
      .join("\n")}`;
  }

  return { analysis, extractedText };
}

// Kompatibilitaets-Wrapper fuer bestehenden Aufruf
export async function analyseSchulplan(
  rawText: string,
  school: string
): Promise<PlanAnalysis> {
  const { analysis } = await analysePlan(school, { kind: "text", text: rawText });
  return analysis;
}
