import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AbsencesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const sp = await searchParams;
  const date = sp.date ? new Date(sp.date) : new Date();
  const dayStart = new Date(date.toDateString());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  const items = await prisma.absence.findMany({
    where: {
      fromDate: { lte: dayEnd },
      toDate: { gte: dayStart },
    },
    include: { child: { include: { parent: true } } },
    orderBy: { fromDate: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="h-title mb-2">Abmeldungen</h1>
      <form className="mb-6 flex items-center gap-2">
        <label className="text-sm text-wili-ink/70">Datum:</label>
        <input
          type="date"
          name="date"
          defaultValue={dayStart.toISOString().slice(0, 10)}
          className="input max-w-xs"
        />
        <button className="btn-primary py-1.5 px-3 text-sm">Anzeigen</button>
      </form>

      {items.length === 0 ? (
        <div className="card text-wili-ink/70">
          Keine Abmeldungen für {dayStart.toLocaleDateString("de-CH")}.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-wili-bluedark">
              <th className="py-2">Kind</th>
              <th>Schule / Klasse</th>
              <th>Haltestelle</th>
              <th>Familie</th>
              <th>Grund</th>
              <th>Zeitraum</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="py-1.5">
                  {a.child.firstName} {a.child.lastName}
                </td>
                <td>
                  {a.child.school} · {a.child.grade}
                </td>
                <td>{a.child.stopName ?? "—"}</td>
                <td>
                  {a.child.parent.name}
                  <div className="text-xs text-wili-ink/60">
                    {a.child.parent.email}
                  </div>
                </td>
                <td>{a.reason ?? "—"}</td>
                <td>
                  {new Date(a.fromDate).toLocaleDateString("de-CH")} –{" "}
                  {new Date(a.toDate).toLocaleDateString("de-CH")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
