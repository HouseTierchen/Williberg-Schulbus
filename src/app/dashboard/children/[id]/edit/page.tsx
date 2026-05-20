import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function EditChild({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  const { id } = await params;
  const c = await prisma.child.findFirst({
    where: { id, parentId: s.sub },
  });
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h-title mb-6">Kind bearbeiten</h1>
      <form
        action={`/api/children/${c.id}`}
        method="post"
        className="card space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vorname</label>
            <input
              name="firstName"
              defaultValue={c.firstName}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Nachname</label>
            <input
              name="lastName"
              defaultValue={c.lastName}
              required
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label">Geburtsdatum</label>
          <input
            type="date"
            name="birthDate"
            defaultValue={c.birthDate?.toISOString().slice(0, 10) ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Schule</label>
          <input
            name="school"
            defaultValue={c.school}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Klasse / Stufe</label>
          <input
            name="grade"
            defaultValue={c.grade}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Bevorzugte Haltestelle</label>
          <input
            name="stopName"
            defaultValue={c.stopName ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Bemerkungen</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={c.notes ?? ""}
            className="input"
          />
        </div>
        <button className="btn-primary w-full" type="submit">
          Aktualisieren
        </button>
      </form>
    </div>
  );
}
