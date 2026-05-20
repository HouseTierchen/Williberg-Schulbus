import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DAYS,
  DAY_LABELS,
  MODES,
  MODE_LABELS,
  SLOTS,
  SLOT_LABELS,
  type Mode,
} from "@/lib/transport";

export const dynamic = "force-dynamic";

export default async function SpecialWeekDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; child?: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const { id } = await params;
  const sp = await searchParams;
  const week = await prisma.specialWeek.findUnique({
    where: { id },
    include: { overrides: true },
  });
  if (!week) notFound();

  const children = await prisma.child.findMany({
    include: { parent: true },
    orderBy: [{ school: "asc" }, { firstName: "asc" }],
  });
  const selectedChildId =
    sp.child && children.find((c) => c.id === sp.child)
      ? sp.child
      : children[0]?.id ?? null;

  const overrides = selectedChildId
    ? week.overrides.filter((o) => o.childId === selectedChildId)
    : [];
  const overrideMap = new Map(
    overrides.map((o) => [`${o.dayOfWeek}-${o.slot}`, o] as const)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin/specialweeks"
        className="text-sm text-wili-blue underline"
      >
        ← zurück
      </Link>
      <h1 className="h-title mt-2">
        {week.year} · KW {week.weekNumber} · {week.title}
      </h1>
      {week.description && (
        <p className="mb-6 text-sm text-wili-ink/70">{week.description}</p>
      )}

      {sp.saved && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-2 text-sm text-green-800">
          Overrides gespeichert.
        </div>
      )}

      <form method="get" className="card mb-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="label">Kind auswählen</label>
          <select
            name="child"
            defaultValue={selectedChildId ?? ""}
            className="input"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} – {c.school} (Familie{" "}
                {c.parent.name})
              </option>
            ))}
          </select>
        </div>
        <button className="btn-secondary">Laden</button>
      </form>

      {selectedChildId && (
        <form
          action={`/api/admin/specialweeks/${week.id}/needs`}
          method="post"
          className="card"
        >
          <input type="hidden" name="childId" value={selectedChildId} />
          <p className="mb-3 text-sm text-wili-ink/70">
            Leerlassen = keine Abweichung (regulärer Plan gilt). Stellen Sie
            sicher, dass die Spezialwoche <strong>aktiv</strong> ist, damit die
            Overrides greifen.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-wili-bluedark">
                  <th className="py-2 pr-3">Slot</th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-2">
                      {DAY_LABELS[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot} className="border-t border-gray-100 align-top">
                    <td className="py-2 pr-3 font-medium text-wili-bluedark">
                      {SLOT_LABELS[slot]}
                    </td>
                    {DAYS.map((d) => {
                      const ex = overrideMap.get(`${d}-${slot}`);
                      const base = `o_${d}_${slot}`;
                      return (
                        <td key={d} className="px-1 py-1">
                          <div className="rounded border border-gray-200 p-1">
                            <select
                              name={`${base}_mode`}
                              defaultValue={ex?.mode ?? ""}
                              className="input py-1 text-xs"
                            >
                              <option value="">— keine —</option>
                              {MODES.map((m) => (
                                <option key={m} value={m}>
                                  {MODE_LABELS[m as Mode]}
                                </option>
                              ))}
                            </select>
                            <input
                              name={`${base}_time`}
                              defaultValue={ex?.customTime ?? ""}
                              placeholder="HH:MM"
                              className="input mt-1 py-1 text-xs"
                            />
                            <input
                              name={`${base}_stop`}
                              defaultValue={ex?.customStop ?? ""}
                              placeholder="Haltestelle"
                              className="input mt-1 py-1 text-xs"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn-primary py-1.5 px-3 text-sm">
              Overrides speichern
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
