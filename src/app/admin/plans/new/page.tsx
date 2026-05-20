import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function NewPlan({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="h-title mb-2">Neuen Schulplan erfassen</h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        Laden Sie eine PDF oder ein Foto des Stundenplans hoch — die KI liest
        die Unterrichtszeiten direkt aus. Alternativ können Sie den Plan-Text
        einfügen.
      </p>
      <form
        action="/api/admin/plans"
        method="post"
        encType="multipart/form-data"
        className="card space-y-4"
      >
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

        <div className="rounded border border-dashed border-wili-blue/40 bg-wili-bluelight/40 p-4">
          <label className="label">PDF oder Foto hochladen</label>
          <input
            type="file"
            name="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
            className="block w-full text-sm"
          />
          <p className="mt-1 text-xs text-wili-ink/60">
            Max. 10 MB. Wird direkt durch die KI ausgewertet.
          </p>
        </div>

        <div>
          <label className="label">… oder Plan-Text einfügen</label>
          <textarea
            name="rawText"
            rows={10}
            className="input font-mono text-sm"
            placeholder="Hier den Stundenplan-Text einfügen…"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="analyze" defaultChecked />
          KI-Analyse direkt starten
        </label>

        {sp.error && (
          <p className="text-sm text-red-600">
            {decodeURIComponent(sp.error)}
          </p>
        )}

        <button className="btn-primary w-full" type="submit">
          Speichern
        </button>
      </form>
    </div>
  );
}
