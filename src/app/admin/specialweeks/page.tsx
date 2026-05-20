import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isoWeek } from "@/lib/transport";

export const dynamic = "force-dynamic";

export default async function SpecialWeeksPage() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const weeks = await prisma.specialWeek.findMany({
    include: { overrides: true },
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
  });
  const current = isoWeek(new Date());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h-title mb-2">Spezial- / Projektwochen</h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        Aktive Spezialwochen überschreiben pro Kind den regulären Wochenplan.
        Aktuelle ISO-Woche: <strong>{current.year}-W{current.week}</strong>
      </p>

      <form
        action="/api/admin/specialweeks"
        method="post"
        className="card mb-6 space-y-3"
      >
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Jahr</label>
            <input
              type="number"
              name="year"
              required
              defaultValue={current.year}
              className="input"
            />
          </div>
          <div>
            <label className="label">KW (1–53)</label>
            <input
              type="number"
              name="weekNumber"
              min={1}
              max={53}
              required
              defaultValue={current.week}
              className="input"
            />
          </div>
          <div>
            <label className="label">Titel</label>
            <input
              name="title"
              required
              placeholder="z.B. Projektwoche"
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label">Beschreibung</label>
          <input
            name="description"
            placeholder="optional"
            className="input"
          />
        </div>
        <button className="btn-primary">Spezialwoche anlegen</button>
      </form>

      <ul className="space-y-3">
        {weeks.length === 0 && (
          <li className="card text-wili-ink/70">
            Noch keine Spezialwochen erfasst.
          </li>
        )}
        {weeks.map((w) => (
          <li key={w.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-wili-bluedark">
                  {w.year} · KW {w.weekNumber} · {w.title}
                </div>
                {w.description && (
                  <p className="text-sm text-wili-ink/70">{w.description}</p>
                )}
                <p className="mt-1 text-xs text-wili-ink/60">
                  {w.overrides.length} Override(s)
                </p>
              </div>
              <span
                className={`badge ${
                  w.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {w.active ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/admin/specialweeks/${w.id}`}
                className="btn-secondary py-1 px-3 text-sm"
              >
                Overrides bearbeiten
              </Link>
              <form
                action={`/api/admin/specialweeks/${w.id}/toggle`}
                method="post"
              >
                <button className="btn-secondary py-1 px-3 text-sm">
                  {w.active ? "Deaktivieren" : "Aktivieren"}
                </button>
              </form>
              <form
                action={`/api/admin/specialweeks/${w.id}/delete`}
                method="post"
                className="ml-auto"
              >
                <button className="text-sm text-red-600 hover:underline">
                  löschen
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
