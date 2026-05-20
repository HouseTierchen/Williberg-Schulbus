import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function NewChild() {
  const s = await getSession();
  if (!s) redirect("/login?next=/dashboard/children/new");
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h-title mb-6">Kind hinzufügen</h1>
      <form action="/api/children" method="post" className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="firstName">
              Vorname
            </label>
            <input id="firstName" name="firstName" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="lastName">
              Nachname
            </label>
            <input id="lastName" name="lastName" required className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="birthDate">
            Geburtsdatum
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="school">
            Schule
          </label>
          <input
            id="school"
            name="school"
            required
            placeholder="z.B. Primarschule Zofingen"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="grade">
            Klasse / Stufe
          </label>
          <input
            id="grade"
            name="grade"
            required
            placeholder="z.B. 3. Klasse"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="stopName">
            Bevorzugte Haltestelle
          </label>
          <input id="stopName" name="stopName" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Bemerkungen
          </label>
          <textarea id="notes" name="notes" rows={3} className="input" />
        </div>
        <button className="btn-primary w-full" type="submit">
          Speichern
        </button>
      </form>
    </div>
  );
}
