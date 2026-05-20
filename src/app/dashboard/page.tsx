import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PushOptIn } from "@/components/PushOptIn";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const s = await getSession();
  if (!s) redirect("/login?next=/dashboard");
  if (s.role === "ADMIN") redirect("/admin");

  const children = await prisma.child.findMany({
    where: { parentId: s.sub },
    include: {
      absences: {
        where: { toDate: { gte: new Date(new Date().toDateString()) } },
        orderBy: { fromDate: "asc" },
      },
    },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="h-title">Familie {s.name}</h1>
          <p className="text-sm text-wili-ink/70">
            Verwalten Sie Ihre Kinder und Krankmeldungen.
          </p>
        </div>
        <Link href="/dashboard/children/new" className="btn-primary">
          Kind hinzufügen
        </Link>
      </div>

      <div className="mb-6">
        <PushOptIn />
      </div>

      {children.length === 0 ? (
        <div className="card text-wili-ink/70">
          Noch kein Kind erfasst.{" "}
          <Link
            href="/dashboard/children/new"
            className="text-wili-blue underline"
          >
            Jetzt erstes Kind hinzufügen
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="h-sub">
                    {c.firstName} {c.lastName}
                  </h2>
                  <p className="text-sm text-wili-ink/70">
                    {c.school} · Klasse {c.grade}
                    {c.stopName && <> · Haltestelle {c.stopName}</>}
                  </p>
                </div>
                <span className="badge bg-wili-bluelight text-wili-bluedark">
                  Aktiv
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-1 text-sm font-semibold text-wili-bluedark">
                  Geplante Abwesenheiten
                </div>
                {c.absences.length === 0 ? (
                  <p className="text-sm text-wili-ink/60">
                    Keine eingetragen.
                  </p>
                ) : (
                  <ul className="text-sm">
                    {c.absences.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {fmt(a.fromDate)} – {fmt(a.toDate)}
                          {a.reason && (
                            <span className="text-wili-ink/60">
                              {" "}
                              · {a.reason}
                            </span>
                          )}
                        </span>
                        <form
                          action={`/api/absences/${a.id}/delete`}
                          method="post"
                        >
                          <button className="text-xs text-red-600 hover:underline">
                            entfernen
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <form
                  action={`/api/children/${c.id}/sick-today`}
                  method="post"
                >
                  <button
                    className="btn-danger py-1.5 px-3 text-sm"
                    type="submit"
                  >
                    Heute krank
                  </button>
                </form>
                <Link
                  href={`/dashboard/children/${c.id}/needs`}
                  className="btn-primary py-1.5 px-3 text-sm"
                >
                  Wochen-Bedarf
                </Link>
                <Link
                  href={`/dashboard/children/${c.id}/absence`}
                  className="btn-secondary py-1.5 px-3 text-sm"
                >
                  Abmeldung (Zeitraum)
                </Link>
                <Link
                  href={`/dashboard/children/${c.id}/edit`}
                  className="text-sm text-wili-blue underline"
                >
                  Bearbeiten
                </Link>
                <form
                  action={`/api/children/${c.id}/delete`}
                  method="post"
                  className="ml-auto"
                >
                  <button className="text-sm text-red-600 hover:underline">
                    Kind entfernen
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("de-CH");
}
