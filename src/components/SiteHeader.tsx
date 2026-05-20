import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function SiteHeader() {
  const s = await getSession();
  return (
    <header className="border-b border-gray-200 bg-white">
      {/* Schmaler oberer Streifen in Wappenblau */}
      <div className="h-1.5 bg-wili-blue" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <img src="/wappen.svg" alt="Wappen Wiliberg" className="h-12 w-auto" />
          <div className="leading-tight">
            <div className="font-serif text-xl font-semibold text-wili-bluedark">
              Gemeinde Wiliberg
            </div>
            <div className="text-xs uppercase tracking-wider text-wili-blue">
              Schulbus-Portal · Eifach schön unterwegs
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-wili-ink hover:text-wili-blue">
            Start
          </Link>
          {s ? (
            <>
              {s.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="text-wili-ink hover:text-wili-blue"
                >
                  Admin
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="text-wili-ink hover:text-wili-blue"
                >
                  Mein Dashboard
                </Link>
              )}
              <form action="/api/auth/logout" method="post">
                <button className="btn-secondary py-1 px-3 text-sm" type="submit">
                  Abmelden ({s.name.split(" ")[0]})
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-wili-ink hover:text-wili-blue">
                Anmelden
              </Link>
              <Link href="/register" className="btn-primary py-1.5 px-3 text-sm">
                Familie registrieren
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
