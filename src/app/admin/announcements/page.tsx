import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="h-title">Mitteilungen</h1>
        <Link href="/admin/announcements/new" className="btn-primary">
          Neue Mitteilung
        </Link>
      </div>
      <p className="mb-6 text-sm text-wili-ink/70">
        Mitteilungen erscheinen auf der Startseite und im Eltern-Dashboard.
        Aktive Mitteilungen können zusätzlich per Push verschickt werden.
      </p>

      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="card text-wili-ink/70">
            Noch keine Mitteilungen erfasst.
          </li>
        )}
        {items.map((a) => (
          <li key={a.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-wili-bluedark">
                  {a.title}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p>
                <p className="mt-2 text-xs text-wili-ink/60">
                  {new Date(a.createdAt).toLocaleString("de-CH")}
                  {a.pushSent && <> · Push verschickt</>}
                </p>
              </div>
              <span
                className={`badge ${
                  a.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {a.active ? "Aktiv" : "Archiviert"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <form
                action={`/api/admin/announcements/${a.id}/toggle`}
                method="post"
              >
                <button className="btn-secondary py-1 px-3 text-sm">
                  {a.active ? "Archivieren" : "Reaktivieren"}
                </button>
              </form>
              {a.active && !a.pushSent && (
                <form
                  action={`/api/admin/announcements/${a.id}/push`}
                  method="post"
                >
                  <button className="btn-primary py-1 px-3 text-sm">
                    Per Push an alle Eltern
                  </button>
                </form>
              )}
              <form
                action={`/api/admin/announcements/${a.id}/delete`}
                method="post"
                className="ml-auto"
              >
                <button className="text-sm text-red-600 hover:underline">
                  löschen
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
