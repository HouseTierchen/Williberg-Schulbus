import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "ADMIN") redirect("/dashboard");

  const [families, childrenCount, plans, routes, todayAbsences] =
    await Promise.all([
      prisma.user.count({ where: { role: "PARENT" } }),
      prisma.child.count(),
      prisma.schoolPlan.count(),
      prisma.busRoute.count({ where: { active: true } }),
      prisma.absence.count({
        where: {
          fromDate: { lte: new Date() },
          toDate: { gte: new Date(new Date().toDateString()) },
        },
      }),
    ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h-title mb-6">Admin · Gemeinderat</h1>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Familien" value={families} />
        <Stat label="Kinder" value={childrenCount} />
        <Stat label="Schulpläne" value={plans} />
        <Stat label="Aktive Linien" value={routes} />
        <Stat label="Heute abgemeldet" value={todayAbsences} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <AdminCard
          href="/admin/plans"
          title="Schulpläne & KI"
          desc="Stundenpläne hochladen und durch KI auswerten lassen."
        />
        <AdminCard
          href="/admin/schedule"
          title="Fahrplan"
          desc="Linien, Haltestellen und Fahrten bearbeiten."
        />
        <AdminCard
          href="/admin/families"
          title="Familien & Kinder"
          desc="Übersicht aller Familien und gemeldeter Kinder."
        />
        <AdminCard
          href="/admin/absences"
          title="Abmeldungen"
          desc="Wer fährt heute nicht? Tagesliste."
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-3xl font-semibold text-wili-bluedark">{value}</div>
      <div className="text-sm text-wili-ink/70">{label}</div>
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
