import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const routes = await prisma.busRoute.findMany({
    include: {
      stops: { orderBy: { orderIdx: "asc" } },
      trips: { orderBy: [{ dayOfWeek: "asc" }, { departureAt: "asc" }] },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h-title mb-6">Fahrplan-Verwaltung</h1>

      <form
        action="/api/admin/routes"
        method="post"
        className="card mb-8 space-y-3"
      >
        <h2 className="h-sub">Neue Linie anlegen</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="z.B. Linie 1 Wiliberg – Zofingen"
            required
            className="input"
          />
          <input
            name="description"
            placeholder="Beschreibung (optional)"
            className="input"
          />
        </div>
        <button className="btn-primary">Linie anlegen</button>
      </form>

      {routes.map((r) => (
        <div key={r.id} className="card mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="h-sub">{r.name}</h3>
              {r.description && (
                <p className="text-sm text-wili-ink/70">{r.description}</p>
              )}
              <span
                className={`badge mt-1 ${
                  r.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {r.active ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
            <form action={`/api/admin/routes/${r.id}/toggle`} method="post">
              <button className="btn-secondary py-1 px-3 text-sm">
                {r.active ? "Deaktivieren" : "Aktivieren"}
              </button>
            </form>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold text-wili-bluedark">
                Haltestellen
              </h4>
              <ol className="ml-4 list-decimal text-sm">
                {r.stops.map((st) => (
                  <li
                    key={st.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {st.name}{" "}
                      <span className="text-wili-ink/60">({st.arriveAt})</span>
                    </span>
                    <form
                      action={`/api/admin/stops/${st.id}/delete`}
                      method="post"
                    >
                      <button className="text-xs text-red-600 hover:underline">
                        löschen
                      </button>
                    </form>
                  </li>
                ))}
              </ol>
              <form
                action="/api/admin/stops"
                method="post"
                className="mt-2 grid grid-cols-[1fr_80px_80px_auto] gap-2"
              >
                <input type="hidden" name="routeId" value={r.id} />
                <input
                  name="name"
                  placeholder="Haltestelle"
                  required
                  className="input py-1 text-sm"
                />
                <input
                  name="orderIdx"
                  type="number"
                  defaultValue={r.stops.length + 1}
                  required
                  className="input py-1 text-sm"
                />
                <input
                  name="arriveAt"
                  placeholder="07:15"
                  required
                  className="input py-1 text-sm"
                />
                <button className="btn-primary py-1 px-2 text-sm">+</button>
              </form>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-wili-bluedark">Fahrten</h4>
              <ul className="text-sm">
                {r.trips.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {dayName(t.dayOfWeek)} · {t.departureAt} ·{" "}
                      {t.direction === "HIN" ? "Hin" : "Rück"}
                      {t.notes && (
                        <span className="text-wili-ink/60"> · {t.notes}</span>
                      )}
                    </span>
                    <form
                      action={`/api/admin/trips/${t.id}/delete`}
                      method="post"
                    >
                      <button className="text-xs text-red-600 hover:underline">
                        löschen
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
              <form
                action="/api/admin/trips"
                method="post"
                className="mt-2 grid grid-cols-[80px_90px_90px_1fr_auto] gap-2"
              >
                <input type="hidden" name="routeId" value={r.id} />
                <select
                  name="dayOfWeek"
                  required
                  className="input py-1 text-sm"
                >
                  <option value="1">Mo</option>
                  <option value="2">Di</option>
                  <option value="3">Mi</option>
                  <option value="4">Do</option>
                  <option value="5">Fr</option>
                </select>
                <input
                  name="departureAt"
                  placeholder="07:30"
                  required
                  className="input py-1 text-sm"
                />
                <select
                  name="direction"
                  required
                  className="input py-1 text-sm"
                >
                  <option value="HIN">Hin</option>
                  <option value="RUECK">Rück</option>
                </select>
                <input
                  name="notes"
                  placeholder="Notiz"
                  className="input py-1 text-sm"
                />
                <button className="btn-primary py-1 px-2 text-sm">+</button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function dayName(d: number) {
  return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d] ?? `Tag ${d}`;
}
