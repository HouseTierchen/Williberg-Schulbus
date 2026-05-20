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
    dayOfWeek: string; // Mo..Fr
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    notes?: string;
  }>;
  recommendedTrips: Array<{
    direction: "HIN" | "RUECK";
    dayOfWeek: string;
    time: string;
    rationale: string;
  }>;
};

export async function analyseSchulplan(
  rawText: string,
  school: string
): Promise<PlanAnalysis> {
  const sys = `Du bist Assistent der Gemeinde Wiliberg (AG, Schweiz). Du analysierst Schulpläne / Stundenpläne und schlägst Schulbus-Fahrzeiten vor.
Antworte AUSSCHLIESSLICH mit gültigem JSON nach folgendem Schema:
{
  "summary": "Kurzfassung in Deutsch",
  "schedule": [{"grade":"...","dayOfWeek":"Mo","startTime":"HH:MM","endTime":"HH:MM","notes":"..."}],
  "recommendedTrips": [{"direction":"HIN"|"RUECK","dayOfWeek":"Mo","time":"HH:MM","rationale":"..."}]
}
Empfohlene Hin-Fahrten ca. 20 Min. vor Unterrichtsbeginn, Rück-Fahrten ca. 10 Min. nach Unterrichtsende.`;

  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: sys,
    messages: [
      {
        role: "user",
        content: `Schule: ${school}\n\nSchulplan (Rohtext):\n${rawText.slice(
          0,
          50000
        )}\n\nBitte analysiere und gib JSON zurück.`,
      },
    ],
  });

  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("KI-Antwort enthielt kein JSON");
  return JSON.parse(match[0]) as PlanAnalysis;
}
