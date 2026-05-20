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
  getAllStopNames,
  type Mode,
  type Slot,
} from "@/lib/transport";

export const dynamic = "force-dynamic";

export default async function NeedsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;
  const child = await prisma.child.findFirst({
    where: { id, parentId: s.sub },
    include: { needs: true },
  });
  if (!child) notFound();

  const siblings = await prisma.child.findMany({
    where: { parentId: s.sub, id: { not: child.id } },
    orderBy: { firstName: "asc" },
  });

  const stopNames = await getAllStopNames();
  const routes = await prisma.busRoute.findMany({
    where: { active: true },
    include: {
      stops: { orderBy: { orderIdx: "asc" } },
      trips: { orderBy: [{ dayOfWeek: "asc" }, { departureAt: "asc" }] },
    },
  });

  const needMap = new Map<string, (typeof child.needs)[number]>();
  for (const n of child.needs) needMap.set(`${n.dayOfWeek}-${n.slot}`, n);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h-title mb-1">Transport-Bedarf</h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        {child.firstName} {child.lastName} · {child.school} · Klasse{" "}
        {child.grade}
      </p>

      {sp.saved && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-2 text-sm text-green-800">
          Bedarf gespeichert.
        </div>
      )}

      {routes.length > 0 && (
        <details className="card mb-4">
          <summary className="cursor-pointer font-semibold text-wili-bluedark">
            Verfügbare Linien & Haltestellen anzeigen
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {routes.map((r) => (
              <div key={r.id} className="text-sm">
                <div className="font-semibold text-wili-bluedark">{r.name}</div>
                {r.description && (
                  <div className="text-xs text-wili-ink/70">
                    {r.description}
                  </div>
                )}
                <div className="mt-1">
                  <span className="text-wili-ink/60">Haltestellen: </span>
                  {r.stops
                    .map((st) => `${st.name} (${st.arriveAt})`)
                    .join(" → ")}
                </div>
                {r.trips.length > 0 && (
                  <div className="mt-1">
                    <span className="text-wili-ink/60">Fahrten: </span>
                    {r.trips
                      .map(
                        (t) =>
                          `${["So","Mo","Di","Mi","Do","Fr","Sa"][t.dayOfWeek]} ${t.departureAt} ${t.direction === "HIN" ? "↗" : "↘"}`
                      )
                      .join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {siblings.length > 0 && (
        <form
          action={`/api/children/${child.id}/needs/copy-from`}
          method="post"
          className="card mb-4 flex items-end gap-3"
        >
          <div className="flex-1">
            <label className="label">Bedarf von Geschwister übernehmen</label>
            <select name="from" required className="input">
              {siblings.map((sib) => (
                <option key={sib.id} value={sib.id}>
                  {sib.firstName} {sib.lastName}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-secondary py-1.5 px-3 text-sm">
            Übernehmen
          </button>
        </form>
      )}

      <form
        action={`/api/children/${child.id}/needs`}
        method="post"
        className="card"
      >
        <p className="mb-4 text-sm text-wili-ink/70">
          Bitte tragen Sie pro Tag und Slot ein, ob Ihr Kind den Bus nutzt und{" "}
          <strong>wo</strong> es ein- bzw. aussteigt. Die Haltestellen-Liste
          wird vom Gemeinderat gepflegt. Bei <em>Sonderzeit</em> (z.B.
          Instrumentalunterricht) tragen Sie die abweichende Uhrzeit ein.
        </p>

        <datalist id="stop-options">
          {stopNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>

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
                    const existing = needMap.get(`${d}-${slot}`);
                    return (
                      <td key={d} className="px-1 py-1">
                        <SlotCell
                          dayOfWeek={d}
                          slot={slot}
                          mode={(existing?.mode as Mode) ?? "BUS"}
                          customTime={existing?.customTime ?? ""}
                          customStop={
                            existing?.customStop ?? child.stopName ?? ""
                          }
                          defaultStop={child.stopName ?? ""}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <a href="/dashboard" className="btn-secondary py-1.5 px-3 text-sm">
            Zurück
          </a>
          <button className="btn-primary py-1.5 px-3 text-sm" type="submit">
            Bedarf speichern
          </button>
        </div>
      </form>
    </div>
  );
}

function SlotCell({
  dayOfWeek,
  slot,
  mode,
  customTime,
  customStop,
  defaultStop,
}: {
  dayOfWeek: number;
  slot: Slot;
  mode: Mode;
  customTime: string;
  customStop: string;
  defaultStop: string;
}) {
  const base = `n_${dayOfWeek}_${slot}`;
  return (
    <div className="rounded border border-gray-200 p-1">
      <select
        name={`${base}_mode`}
        defaultValue={mode}
        className="input py-1 text-xs"
      >
        {MODES.map((m) => (
          <option key={m} value={m}>
            {MODE_LABELS[m]}
          </option>
        ))}
      </select>
      <input
        name={`${base}_stop`}
        defaultValue={customStop}
        list="stop-options"
        placeholder={defaultStop || "Haltestelle"}
        className="input mt-1 py-1 text-xs"
      />
      <input
        name={`${base}_time`}
        defaultValue={customTime}
        placeholder="HH:MM (Sonderzeit)"
        className="input mt-1 py-1 text-xs"
      />
    </div>
  );
}
