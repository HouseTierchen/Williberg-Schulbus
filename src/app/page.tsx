import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [routes, announcements] = await Promise.all([
    prisma.busRoute.findMany({
      where: { active: true },
      include: {
        stops: { orderBy: { orderIdx: "asc" } },
        trips: { orderBy: [{ dayOfWeek: "asc" }, { departureAt: "asc" }] },
      },
    }),
    prisma.announcement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-wili-bluelight to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-wili-blue">
              Gemeinde Wiliberg
            </p>
            <h1 className="font-serif text-4xl font-semibold text-wili-bluedark md:text-5xl">
              Schulbus-Portal
            </h1>
            <p className="mt-4 max-w-md text-wili-ink/80">
              Aktuelle Fahrpläne, einfache Krankmeldungen und ein Überblick für
              jede Familie. Stundenpläne der Schulen werden automatisch mit
              Hilfe von KI ausgewertet, damit der Bus immer pünktlich passt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary">
                Familie registrieren
              </Link>
              <Link href="/login" className="btn-secondary">
                Anmelden
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/wappen.svg"
              alt="Wappen Wiliberg"
              className="h-56 w-auto drop-shadow"
            />
          </div>
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <h2 className="h-title mb-3">Aktuelle Mitteilungen</h2>
          <div className="grid gap-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="card border-l-4 border-l-wili-blue"
              >
                <div className="font-semibold text-wili-bluedark">
                  {a.title}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p>
                <p className="mt-2 text-xs text-wili-ink/60">
                  {new Date(a.createdAt).toLocaleString("de-CH")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fahrplan */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="h-title mb-6">Aktueller Fahrplan</h2>
        {routes.length === 0 ? (
          <div className="card text-wili-ink/70">
            Es sind noch keine Linien veröffentlicht. Der Gemeinderat arbeitet
            am Fahrplan.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {routes.map((r) => (
              <div key={r.id} className="card">
                <h3 className="h-sub mb-2">{r.name}</h3>
                {r.description && (
                  <p className="mb-3 text-sm text-wili-ink/70">
                    {r.description}
                  </p>
                )}
                <div className="mb-3">
                  <div className="text-sm font-semibold text-wili-bluedark">
                    Haltestellen
                  </div>
                  <ol className="ml-5 list-decimal text-sm">
                    {r.stops.map((s) => (
                      <li key={s.id}>
                        {s.name}{" "}
                        <span className="text-wili-ink/60">({s.arriveAt})</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="text-sm font-semibold text-wili-bluedark">
                    Fahrten
                  </div>
                  <ul className="text-sm">
                    {r.trips.map((t) => (
                      <li key={t.id}>
                        {dayName(t.dayOfWeek)} ·{" "}
                        <span className="font-medium">{t.departureAt}</span> ·{" "}
                        <span className="badge bg-wili-bluelight text-wili-bluedark">
                          {t.direction === "HIN" ? "Hinfahrt" : "Rückfahrt"}
                        </span>
                        {t.notes && (
                          <span className="text-wili-ink/60"> – {t.notes}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function dayName(d: number) {
  return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d] ?? `Tag ${d}`;
}
