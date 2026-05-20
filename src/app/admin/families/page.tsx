import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FamiliesPage() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const families = await prisma.user.findMany({
    where: { role: "PARENT" },
    include: { children: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h-title mb-6">Familien & Kinder</h1>
      <div className="space-y-4">
        {families.length === 0 && (
          <div className="card text-wili-ink/70">
            Noch keine Familien registriert.
          </div>
        )}
        {families.map((f) => (
          <div key={f.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-wili-bluedark">{f.name}</div>
                <div className="text-sm text-wili-ink/70">
                  {f.email}
                  {f.phone && <> · {f.phone}</>}
                  {f.address && <> · {f.address}</>}
                </div>
              </div>
              <span className="badge bg-wili-bluelight text-wili-bluedark">
                {f.children.length} Kind(er)
              </span>
            </div>
            {f.children.length > 0 && (
              <ul className="mt-3 ml-4 list-disc text-sm">
                {f.children.map((c) => (
                  <li key={c.id}>
                    {c.firstName} {c.lastName} – {c.school}, Klasse {c.grade}
                    {c.stopName && <> · {c.stopName}</>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
