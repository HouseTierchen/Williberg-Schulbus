import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const plans = await prisma.schoolPlan.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="h-title">Schulpläne</h1>
        <Link href="/admin/plans/new" className="btn-primary">
          Plan hinzufügen
        </Link>
      </div>

      {plans.length === 0 && (
        <div className="card text-wili-ink/70">
          Noch keine Pläne erfasst. Laden Sie den Stundenplan einer Schule als
          Text hoch – die KI extrahiert Unterrichtszeiten und schlägt passende
          Bus-Fahrzeiten vor.
        </div>
      )}

      <ul className="space-y-3">
        {plans.map((p) => (
          <li key={p.id} className="card flex items-start justify-between">
            <div>
              <div className="font-semibold text-wili-bluedark">{p.title}</div>
              <div className="text-sm text-wili-ink/70">
                {p.school}
                {p.validFrom && (
                  <>
                    {" "}
                    · gültig ab{" "}
                    {new Date(p.validFrom).toLocaleDateString("de-CH")}
                  </>
                )}
                · {new Date(p.createdAt).toLocaleDateString("de-CH")}
              </div>
              {p.aiSummary && (
                <p className="mt-2 text-sm">{p.aiSummary.slice(0, 220)}…</p>
              )}
            </div>
            <div className="ml-4 flex flex-col gap-2">
              <Link
                href={`/admin/plans/${p.id}`}
                className="btn-secondary py-1 px-3 text-sm"
              >
                Details
              </Link>
              <form
                action={`/api/admin/plans/${p.id}/analyze`}
                method="post"
              >
                <button className="btn-primary py-1 px-3 text-sm">
                  {p.aiSummary ? "Neu analysieren" : "KI-Analyse starten"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
