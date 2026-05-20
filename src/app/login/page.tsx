import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const s = await getSession();
  if (s) redirect(s.role === "ADMIN" ? "/admin" : "/dashboard");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="h-title mb-6">Anmelden</h1>
      <form action="/api/auth/login" method="post" className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="input"
          />
        </div>
        {sp.next && <input type="hidden" name="next" value={sp.next} />}
        {sp.error && (
          <p className="text-sm text-red-600">
            Ungültige Anmeldung. Bitte versuchen Sie es erneut.
          </p>
        )}
        <button className="btn-primary w-full" type="submit">
          Anmelden
        </button>
        <p className="text-sm text-wili-ink/70">
          Noch kein Konto?{" "}
          <Link href="/register" className="text-wili-blue underline">
            Familie registrieren
          </Link>
        </p>
      </form>
    </div>
  );
}
