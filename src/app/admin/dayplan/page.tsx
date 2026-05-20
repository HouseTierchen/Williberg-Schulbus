import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  SLOTS,
  SLOT_LABELS,
  isoWeek,
  isSchoolHoliday,
  resolveNeedsForChild,
  type Slot,
} from "@/lib/transport";

export const dynamic = "force-dynamic";

export default async function DayPlanPage({
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
  const dow = date.getDay();
  const { year, week } = isoWeek(date);

  const holiday = await isSchoolHoliday(date);
  const specialWeek = await prisma.specialWeek.findFirst({
    where: { year, weekNumber: week, active: true },
  });

  const children = await prisma.child.findMany({
    include: { parent: true },
    orderBy: [{ school: "asc" }, { firstName: "asc" }],
  });
  const absences = await prisma.absence.findMany({
    where: {
      fromDate: { lte: dayEnd },
      toDate: { gte: dayStart },
    },
  });
  const absentChildIds = new Set(absences.map((a) => a.childId));

  type Row = {
    childId: string;
    childName: string;
    family: string;
    school: string;
    grade: string;
    defaultStop: string | null;
    slot: Slot;
    mode: string;
    customTime: string | null;
    customStop: string | null;
    source: "regular" | "special";
    absent: boolean;
  };
  const rows: Row[] = [];

  if (dow >= 1 && dow <= 5 && !holiday) {
    for (const c of children) {
      const needs = await resolveNeedsForChild(c.id, date);
      for (const slot of SLOTS) {
        const n = needs[slot];
        if (!n) continue;
        if (n.mode === "NONE") continue;
        rows.push({
          childId: c.id,
          childName: `${c.firstName} ${c.lastName}`,
          family: c.parent.name,
          school: c.school,
          grade: c.grade,
          defaultStop: c.stopName,
          slot,
          mode: n.mode,
          customTime: n.customTime ?? null,
          customStop: n.customStop ?? null,
          source: n.source,
          absent: absentChildIds.has(c.id),
        });
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h-title mb-2">Tagesplan</h1>
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

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="badge bg-wili-bluelight text-wili-bluedark">
          {dayStart.toLocaleDateString("de-CH", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}{" "}
          · KW {week}
        </span>
        {holiday && (
          <span className="badge bg-amber-100 text-amber-800">
            Schulfrei: {holiday.name}
          </span>
        )}
        {specialWeek && (
          <span className="badge bg-purple-100 text-purple-800">
            Spezialwoche: {specialWeek.title}
          </span>
        )}
        {dow === 0 || dow === 6 ? (
          <span className="badge bg-gray-200 text-gray-700">Wochenende</span>
        ) : null}
      </div>

      {holiday || dow === 0 || dow === 6 ? (
        <div className="card text-wili-ink/70">
          Kein Schulbus-Betrieb an diesem Tag.
        </div>
      ) : rows.length === 0 ? (
        <div className="card text-wili-ink/70">
          Keine Transport-Bedarfe erfasst. Eltern müssen den Wochen-Bedarf
          ihrer Kinder im Dashboard hinterlegen.
        </div>
      ) : (
        SLOTS.map((slot) => {
          const slotRows = rows.filter((r) => r.slot === slot);
          if (slotRows.length === 0) return null;
          return (
            <div key={slot} className="card mb-4">
              <h2 className="h-sub mb-2">{SLOT_LABELS[slot]}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-wili-bluedark">
                    <th className="py-1">Kind</th>
                    <th>Schule / Klasse</th>
                    <th>Haltestelle</th>
                    <th>Modus</th>
                    <th>Familie</th>
                  </tr>
                </thead>
                <tbody>
                  {slotRows.map((r) => (
                    <tr
                      key={r.childId + r.slot}
                      className={`border-t border-gray-100 ${
                        r.absent ? "opacity-50 line-through" : ""
                      }`}
                    >
                      <td className="py-1">
                        {r.childName}
                        {r.source === "special" && (
                          <span className="badge ml-2 bg-purple-100 text-purple-800">
                            Spezialwoche
                          </span>
                        )}
                        {r.absent && (
                          <span className="badge ml-2 bg-red-100 text-red-700">
                            abgemeldet
                          </span>
                        )}
                      </td>
                      <td>
                        {r.school} · {r.grade}
                      </td>
                      <td>{r.customStop ?? r.defaultStop ?? "—"}</td>
                      <td>
                        {r.mode === "CUSTOM"
                          ? `Sonderzeit ${r.customTime ?? ""}`
                          : "Bus"}
                      </td>
                      <td>{r.family}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
