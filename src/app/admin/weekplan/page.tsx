import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrintButton } from "@/components/PrintButton";
import {
  DAYS,
  DAY_LABELS,
  SLOTS,
  SLOT_LABELS,
  isoWeek,
  isSchoolHoliday,
  resolveNeedsForChild,
  type Slot,
} from "@/lib/transport";

export const dynamic = "force-dynamic";

function dateOfIsoWeek(year: number, week: number, dow: number) {
  // dow: 1..7 (Mo..So)
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay() || 7;
  const isoMonday = new Date(simple);
  isoMonday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
  const target = new Date(isoMonday);
  target.setUTCDate(isoMonday.getUTCDate() + (dow - 1));
  return target;
}

export default async function WeekPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; week?: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const sp = await searchParams;
  const now = new Date();
  const cur = isoWeek(now);
  const year = Number(sp.year) || cur.year;
  const week = Number(sp.week) || cur.week;

  const children = await prisma.child.findMany({
    include: { parent: true },
    orderBy: [{ school: "asc" }, { firstName: "asc" }],
  });

  type Entry = {
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

  const byDay: Record<number, Entry[]> = {};
  const dayInfo: Record<
    number,
    { date: Date; holiday: { name: string } | null }
  > = {};

  for (const d of DAYS) {
    const date = dateOfIsoWeek(year, week, d);
    const holiday = await isSchoolHoliday(date);
    dayInfo[d] = { date, holiday: holiday ? { name: holiday.name } : null };
    byDay[d] = [];
    if (holiday) continue;
    const dayStart = new Date(date.toDateString());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const absences = await prisma.absence.findMany({
      where: { fromDate: { lte: dayEnd }, toDate: { gte: dayStart } },
      select: { childId: true },
    });
    const absentIds = new Set(absences.map((a) => a.childId));
    for (const c of children) {
      const needs = await resolveNeedsForChild(c.id, date);
      for (const slot of SLOTS) {
        const n = needs[slot];
        if (!n || n.mode === "NONE") continue;
        byDay[d].push({
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
          absent: absentIds.has(c.id),
        });
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 print:py-2">
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <div>
          <h1 className="h-title">Wochenliste</h1>
          <p className="text-sm text-wili-ink/70">
            Kopierfertige Liste für Frey Reisen. Druckansicht über
            Browser-Druck.
          </p>
        </div>
        <form className="ml-auto flex items-end gap-2">
          <div>
            <label className="label">Jahr</label>
            <input
              type="number"
              name="year"
              defaultValue={year}
              className="input"
            />
          </div>
          <div>
            <label className="label">KW</label>
            <input
              type="number"
              name="week"
              defaultValue={week}
              min={1}
              max={53}
              className="input"
            />
          </div>
          <button className="btn-primary py-1.5 px-3 text-sm">Anzeigen</button>
        </form>
        <Link
          href={`/api/admin/weekplan.csv?year=${year}&week=${week}`}
          className="btn-secondary py-1.5 px-3 text-sm"
        >
          CSV herunterladen
        </Link>
        <PrintButton />
      </div>

      <div className="mb-6 hidden print:block">
        <h1 className="font-serif text-2xl font-semibold">
          Schulbus Wiliberg – Wochenliste {year} · KW {week}
        </h1>
        <p className="text-xs">
          Gemeinde Wiliberg · automatisch erzeugt am{" "}
          {now.toLocaleString("de-CH")}
        </p>
      </div>

      {DAYS.map((d) => {
        const info = dayInfo[d];
        const entries = byDay[d];
        return (
          <section key={d} className="mb-6 break-inside-avoid">
            <h2 className="h-sub mb-2 print:text-base">
              {DAY_LABELS[d]} · {info.date.toLocaleDateString("de-CH")}
              {info.holiday && (
                <span className="badge ml-2 bg-amber-100 text-amber-800">
                  Schulfrei: {info.holiday.name}
                </span>
              )}
            </h2>
            {info.holiday ? (
              <div className="card text-sm text-wili-ink/70 print:p-2">
                Kein Schulbus-Betrieb.
              </div>
            ) : entries.length === 0 ? (
              <div className="card text-sm text-wili-ink/70 print:p-2">
                Keine Fahrten gemeldet.
              </div>
            ) : (
              SLOTS.map((slot) => {
                const slotEntries = entries.filter((e) => e.slot === slot);
                if (slotEntries.length === 0) return null;
                return (
                  <div key={slot} className="card mb-2 print:p-2">
                    <div className="mb-1 font-semibold text-wili-bluedark">
                      {SLOT_LABELS[slot]}
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-wili-ink/60">
                          <th>Kind</th>
                          <th>Schule</th>
                          <th>Klasse</th>
                          <th>Haltestelle</th>
                          <th>Modus</th>
                          <th>Familie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slotEntries.map((e) => (
                          <tr
                            key={e.childId + e.slot}
                            className={`border-t border-gray-100 ${
                              e.absent ? "opacity-50 line-through" : ""
                            }`}
                          >
                            <td className="py-0.5">{e.childName}</td>
                            <td>{e.school}</td>
                            <td>{e.grade}</td>
                            <td>{e.customStop ?? e.defaultStop ?? "—"}</td>
                            <td>
                              {e.mode === "CUSTOM"
                                ? `Sonderzeit ${e.customTime ?? ""}`
                                : "Bus"}
                              {e.source === "special" && (
                                <span className="ml-1 text-xs text-purple-700">
                                  (Spezial)
                                </span>
                              )}
                              {e.absent && (
                                <span className="ml-1 text-xs text-red-600">
                                  abgemeldet
                                </span>
                              )}
                            </td>
                            <td>{e.family}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </section>
        );
      })}
    </div>
  );
}
