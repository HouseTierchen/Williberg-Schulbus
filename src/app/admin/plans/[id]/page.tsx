import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function PlanDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const { id } = await params;
  const p = await prisma.schoolPlan.findUnique({ where: { id } });
  if (!p) notFound();

  let schedule: unknown[] = [];
  let trips: unknown[] = [];
  if (p.aiSchedule) {
    try {
      const parsed = JSON.parse(p.aiSchedule);
      schedule = parsed.schedule ?? [];
      trips = parsed.recommendedTrips ?? [];
    } catch {}
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="h-title">{p.title}</h1>
      <p className="mb-6 text-sm text-wili-ink/70">{p.school}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="h-sub mb-2">KI-Zusammenfassung</h2>
          {p.aiSummary ? (
            <p className="whitespace-pre-wrap text-sm">{p.aiSummary}</p>
          ) : (
            <p className="text-sm text-wili-ink/60">
              Noch keine KI-Analyse durchgeführt.
            </p>
          )}
          <form
            action={`/api/admin/plans/${p.id}/analyze`}
            method="post"
            className="mt-4"
          >
            <button className="btn-primary py-1.5 px-3 text-sm">
              {p.aiSummary ? "Erneut analysieren" : "KI-Analyse starten"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="h-sub mb-2">Empfohlene Bus-Fahrten</h2>
          {trips.length === 0 ? (
            <p className="text-sm text-wili-ink/60">
              Keine Empfehlungen verfügbar.
            </p>
          ) : (
            <ul className="text-sm">
              {(trips as Array<{
                direction: string;
                dayOfWeek: string;
                time: string;
                rationale: string;
              }>).map((t, i) => (
                <li key={i} className="border-b border-gray-100 py-1">
                  <span className="badge bg-wili-bluelight text-wili-bluedark">
                    {t.direction === "HIN" ? "Hin" : "Rück"}
                  </span>{" "}
                  {t.dayOfWeek} <strong>{t.time}</strong>
                  <div className="text-xs text-wili-ink/60">{t.rationale}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="h-sub mb-2">Erkannte Unterrichtszeiten</h2>
        {schedule.length === 0 ? (
          <p className="text-sm text-wili-ink/60">Noch keine Daten.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-wili-bluedark">
                <th>Klasse</th>
                <th>Tag</th>
                <th>Start</th>
                <th>Ende</th>
                <th>Notiz</th>
              </tr>
            </thead>
            <tbody>
              {(schedule as Array<{
                grade: string;
                dayOfWeek: string;
                startTime: string;
                endTime: string;
                notes?: string;
              }>).map((r, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td>{r.grade}</td>
                  <td>{r.dayOfWeek}</td>
                  <td>{r.startTime}</td>
                  <td>{r.endTime}</td>
                  <td className="text-wili-ink/70">{r.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <details className="card mt-4">
        <summary className="cursor-pointer font-semibold text-wili-bluedark">
          Original-Text anzeigen
        </summary>
        <pre className="mt-3 whitespace-pre-wrap font-mono text-xs">
          {p.rawText}
        </pre>
      </details>
    </div>
  );
}
