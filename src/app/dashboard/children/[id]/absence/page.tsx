import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AbsencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  const { id } = await params;
  const c = await prisma.child.findFirst({
    where: { id, parentId: s.sub },
    include: { absences: { orderBy: { fromDate: "desc" }, take: 20 } },
  });
  if (!c) notFound();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h-title mb-2">
        Krankmeldung / Abmeldung
      </h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        {c.firstName} {c.lastName} · {c.school}
      </p>
      <form action="/api/absences" method="post" className="card space-y-4">
        <input type="hidden" name="childId" value={c.id} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Von</label>
            <input
              type="date"
              name="fromDate"
              required
              defaultValue={today}
              className="input"
            />
          </div>
          <div>
            <label className="label">Bis</label>
            <input
              type="date"
              name="toDate"
              required
              defaultValue={today}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label">Grund (optional)</label>
          <select name="reason" className="input">
            <option value="">– bitte wählen –</option>
            <option>Krankheit</option>
            <option>Arzttermin</option>
            <option>Ferien / Urlaub</option>
            <option>Familiäre Gründe</option>
            <option>Sonstiges</option>
          </select>
        </div>
        <button className="btn-primary w-full" type="submit">
          Abmeldung speichern
        </button>
      </form>

      <h2 className="h-sub mt-10 mb-3">Bisherige Meldungen</h2>
      <ul className="space-y-2 text-sm">
        {c.absences.length === 0 && (
          <li className="text-wili-ink/60">Noch keine Meldungen.</li>
        )}
        {c.absences.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded border border-gray-200 p-2"
          >
            <span>
              {new Date(a.fromDate).toLocaleDateString("de-CH")} –{" "}
              {new Date(a.toDate).toLocaleDateString("de-CH")}
              {a.reason && (
                <span className="text-wili-ink/60"> · {a.reason}</span>
              )}
            </span>
            <form action={`/api/absences/${a.id}/delete`} method="post">
              <button className="text-xs text-red-600 hover:underline">
                entfernen
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
