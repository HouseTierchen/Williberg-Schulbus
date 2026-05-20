import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const s = await getSession();
  if (s) redirect(s.role === "ADMIN" ? "/admin" : "/dashboard");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="h-title mb-2">Familie registrieren</h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        Pro Familie wird ein Zugang angelegt. Sie können danach Kinder
        einpflegen und Krankmeldungen erfassen.
      </p>
      <form action="/api/auth/register" method="post" className="card space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Name (Familie)
          </label>
          <input id="name" name="name" required className="input" />
        </div>
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
            Passwort (min. 8 Zeichen)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Telefon (optional)
          </label>
          <input id="phone" name="phone" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="address">
            Adresse (optional)
          </label>
          <input id="address" name="address" className="input" />
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-wili-blue">
            Ich bin Mitglied des Gemeinderats (Admin-Code)
          </summary>
          <div className="mt-2">
            <label className="label" htmlFor="adminCode">
              Admin-Code
            </label>
            <input id="adminCode" name="adminCode" className="input" />
          </div>
        </details>
        {sp.error && (
          <p className="text-sm text-red-600">{decodeURIComponent(sp.error)}</p>
        )}
        <button className="btn-primary w-full" type="submit">
          Konto erstellen
        </button>
        <p className="text-sm text-wili-ink/70">
          Bereits registriert?{" "}
          <Link href="/login" className="text-wili-blue underline">
            Anmelden
          </Link>
        </p>
      </form>
    </div>
  );
}
