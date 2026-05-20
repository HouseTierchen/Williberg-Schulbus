import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function NewPlan() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="h-title mb-2">Neuen Schulplan erfassen</h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        Fügen Sie den Text des Stundenplans ein (z.B. aus einer PDF kopiert).
        Anschliessend kann die KI Unterrichtszeiten und Bus-Empfehlungen
        ableiten.
      </p>
      <form action="/api/admin/plans" method="post" className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Schule</label>
            <input name="school" required className="input" />
          </div>
          <div>
            <label className="label">Titel</label>
            <input
              name="title"
              required
              placeholder="z.B. Stundenplan 2026/27"
              className="input"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Gültig ab</label>
            <input type="date" name="validFrom" className="input" />
          </div>
          <div>
            <label className="label">Gültig bis</label>
            <input type="date" name="validTo" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Plan-Text</label>
          <textarea
            name="rawText"
            rows={14}
            required
            className="input font-mono text-sm"
            placeholder="Hier den Stundenplan-Text einfügen…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="analyze" defaultChecked />
          KI-Analyse direkt starten
        </label>
        <button className="btn-primary w-full" type="submit">
          Speichern
        </button>
      </form>
    </div>
  );
}
