import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HolidaysPage() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const items = await prisma.schoolHoliday.findMany({
    orderBy: { fromDate: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h-title mb-2">Schulfreie Tage / Ferien</h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        An diesen Tagen findet kein Schulbus-Betrieb statt. Wird in der
        Tagesübersicht automatisch berücksichtigt.
      </p>

      <form
        action="/api/admin/holidays"
        method="post"
        className="card mb-6 space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Bezeichnung</label>
            <input
              name="name"
              required
              placeholder="z.B. Sommerferien"
              className="input"
            />
          </div>
          <div>
            <label className="label">Notiz</label>
            <input
              name="notes"
              placeholder="optional"
              className="input"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Von</label>
            <input type="date" name="fromDate" required className="input" />
          </div>
          <div>
            <label className="label">Bis</label>
            <input type="date" name="toDate" required className="input" />
          </div>
        </div>
        <button className="btn-primary">Hinzufügen</button>
      </form>

      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="card text-wili-ink/70">
            Noch keine schulfreien Tage erfasst.
          </li>
        )}
        {items.map((h) => (
          <li key={h.id} className="card flex items-center justify-between">
            <div>
              <div className="font-semibold text-wili-bluedark">{h.name}</div>
              <div className="text-sm text-wili-ink/70">
                {new Date(h.fromDate).toLocaleDateString("de-CH")} –{" "}
                {new Date(h.toDate).toLocaleDateString("de-CH")}
                {h.notes && <> · {h.notes}</>}
              </div>
            </div>
            <form action={`/api/admin/holidays/${h.id}/delete`} method="post">
              <button className="text-sm text-red-600 hover:underline">
                löschen
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
