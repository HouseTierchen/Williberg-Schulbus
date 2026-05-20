import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PushOptIn } from "@/components/PushOptIn";
import { isoWeek } from "@/lib/transport";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const dayStart = new Date(now.toDateString());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { year, week } = isoWeek(now);

  const [
    families,
    childrenAll,
    plans,
    routes,
    todayAbsences,
    newFamilies,
    activeSpecial,
    activeAnnouncements,
    childrenWithNeeds,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.child.findMany({
      include: { parent: true, needs: { select: { id: true } } },
      orderBy: { firstName: "asc" },
    }),
    prisma.schoolPlan.count(),
    prisma.busRoute.count({ where: { active: true } }),
    prisma.absence.count({
      where: { fromDate: { lte: dayEnd }, toDate: { gte: dayStart } },
    }),
    prisma.user.count({
      where: { role: "PARENT", createdAt: { gte: weekAgo } },
    }),
    prisma.specialWeek.findFirst({
      where: { year, weekNumber: week, active: true },
    }),
    prisma.announcement.count({ where: { active: true } }),
    prisma.child.count({ where: { needs: { some: {} } } }),
  ]);

  const childrenWithoutNeeds = childrenAll.filter((c) => c.needs.length === 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h-title mb-6">Admin · Gemeinderat</h1>

      <div className="mb-6">
        <PushOptIn />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Familien" value={families} accent={newFamilies > 0 ? `+${newFamilies} neu` : undefined} />
        <Stat label="Kinder" value={childrenAll.length} />
        <Stat
          label="Bedarf gepflegt"
          value={`${childrenWithNeeds}/${childrenAll.length}`}
          warn={childrenWithoutNeeds.length > 0}
        />
        <Stat label="Schulpläne" value={plans} />
        <Stat label="Heute abgemeldet" value={todayAbsences} />
      </div>

      {(childrenWithoutNeeds.length > 0 || activeSpecial || activeAnnouncements > 0) && (
        <div className="mt-6 space-y-3">
          {activeSpecial && (
            <div className="rounded border border-purple-300 bg-purple-50 p-3 text-sm">
              <strong className="text-purple-900">
                Spezialwoche aktiv:
              </strong>{" "}
              {activeSpecial.year} · KW {activeSpecial.weekNumber} ·{" "}
              {activeSpecial.title}
            </div>
          )}
          {childrenWithoutNeeds.length > 0 && (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              <div className="mb-1 font-semibold text-amber-900">
                {childrenWithoutNeeds.length} Kind(er) ohne gepflegten
                Wochen-Bedarf:
              </div>
              <ul className="ml-4 list-disc text-amber-900">
                {childrenWithoutNeeds.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    {c.firstName} {c.lastName} – Familie {c.parent.name} (
                    {c.parent.email})
                  </li>
                ))}
                {childrenWithoutNeeds.length > 8 && (
                  <li>… und {childrenWithoutNeeds.length - 8} weitere</li>
                )}
              </ul>
              <Link
                href="/admin/announcements/new?prefill=needs"
                className="mt-2 inline-block text-amber-900 underline"
              >
                → Erinnerung an alle Eltern verschicken
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <AdminCard
          href="/admin/dayplan"
          title="Tagesplan"
          desc="Wer fährt heute? Inkl. Spezialwochen, Ferien, Abmeldungen."
        />
        <AdminCard
          href="/admin/weekplan"
          title="Wochenliste / Export"
          desc="Druckbare Liste pro Woche – fertig für Frey Reisen."
        />
        <AdminCard
          href="/admin/announcements"
          title="Mitteilungen"
          desc="Info an alle Eltern, inkl. Push-Versand."
        />
        <AdminCard
          href="/admin/plans"
          title="Schulpläne & KI"
          desc="PDF/Foto hochladen, KI extrahiert Stundenplan."
        />
        <AdminCard
          href="/admin/schedule"
          title="Fahrplan / Linien"
          desc="Linien, Haltestellen und Fahrten bearbeiten."
        />
        <AdminCard
          href="/admin/specialweeks"
          title="Spezialwochen"
          desc="Projekt-/Sportwochen mit abweichendem Plan."
        />
        <AdminCard
          href="/admin/holidays"
          title="Ferien / schulfrei"
          desc="Tage ohne Schulbus-Betrieb."
        />
        <AdminCard
          href="/admin/families"
          title="Familien & Kinder"
          desc="Übersicht aller Familien."
        />
        <AdminCard
          href="/admin/absences"
          title="Abmeldungen"
          desc="Wer ist krank gemeldet?"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number | string;
  accent?: string;
  warn?: boolean;
}) {
  return (
    <div className={`card ${warn ? "border-amber-300" : ""}`}>
      <div
        className={`text-3xl font-semibold ${
          warn ? "text-amber-700" : "text-wili-bluedark"
        }`}
      >
        {value}
      </div>
      <div className="text-sm text-wili-ink/70">{label}</div>
      {accent && (
        <div className="mt-1 text-xs font-medium text-green-700">{accent}</div>
      )}
    </div>
  );
}

function AdminCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card transition hover:border-wili-blue hover:shadow-md"
    >
      <h3 className="h-sub mb-1">{title}</h3>
      <p className="text-sm text-wili-ink/70">{desc}</p>
    </Link>
  );
}
