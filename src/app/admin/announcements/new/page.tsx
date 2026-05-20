import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const PREFILLS: Record<string, { title: string; body: string }> = {
  needs: {
    title: "Bitte Schulbus-Bedarf erfassen",
    body: "Liebe Eltern\n\nBitte tragen Sie unter Wochen-Bedarf für jedes Kind ein, an welchen Tagen und Slots es den Schulbus nutzt. Vielen Dank!\n\nGemeinderat Wiliberg",
  },
  delay: {
    title: "Schulbus heute verspätet",
    body: "Der Schulbus verspätet sich heute aufgrund der Witterung um ca. 10 Minuten.",
  },
};

export default async function NewAnnouncement({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const sp = await searchParams;
  const pre = sp.prefill ? PREFILLS[sp.prefill] : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="h-title mb-2">Neue Mitteilung</h1>
      <p className="mb-6 text-sm text-wili-ink/70">
        Erscheint auf Startseite und im Eltern-Dashboard. Push-Versand
        anschliessend in der Übersicht.
      </p>
      <form
        action="/api/admin/announcements"
        method="post"
        className="card space-y-3"
      >
        <div>
          <label className="label">Titel</label>
          <input
            name="title"
            required
            defaultValue={pre?.title ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Inhalt</label>
          <textarea
            name="body"
            required
            rows={8}
            defaultValue={pre?.body ?? ""}
            className="input"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sendPush" defaultChecked />
          Direkt per Push an alle Eltern verschicken
        </label>
        <button className="btn-primary w-full">Veröffentlichen</button>
      </form>
    </div>
  );
}
