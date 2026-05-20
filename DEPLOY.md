# Schulbus Wiliberg — Deployment-Anleitung

So bringst du die App auf eine öffentliche URL, damit Eltern und Gemeinderat sie auf ihrem Handy installieren können.

**Empfehlung: Vercel + Neon Postgres** (beide gratis-Tier vorhanden, voll ausreichend für Wiliberg).

---

## 1. Lokales Setup zum Testen (Claude Code Desktop, ca. 5 Min.)

```bash
# Im geklonten Repo:
cp .env.example .env
# .env oeffnen und folgende Werte setzen:
#   AUTH_SECRET=<mind. 32 Zeichen zufaellig, z.B. "openssl rand -base64 32">
#   ANTHROPIC_API_KEY=<sk-ant-... von console.anthropic.com>
#   ADMIN_REGISTRATION_CODE=<beliebig>

npm install
node scripts/gen-vapid.mjs   # zeigt VAPID-Keys an → in .env eintragen
npm run db:push              # SQLite-DB erzeugen
npm run db:seed              # Admin: admin@wiliberg.ch / wiliberg-admin
npm run dev                  # http://localhost:3000
```

Im Browser anmelden → Familie registrieren / als Admin einloggen. Funktioniert lokal komplett, inklusive PWA-Installation.

> Hinweis: Push funktioniert lokal nur auf `https://` oder `localhost`. Vercel liefert automatisch HTTPS.

---

## 2. Cloud-DB anlegen (Neon, gratis, ~3 Min.)

1. Konto auf https://neon.tech erstellen
2. „Create project" → Region **Frankfurt** (nahe CH)
3. Projekt-Name: `schulbus-wiliberg`
4. Postgres-Version 16 belassen
5. Nach dem Anlegen unter „Connection Details" → **Connection string** kopieren
   - Sieht aus wie `postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require`

In `prisma/schema.prisma` den Provider umstellen:

```prisma
datasource db {
  provider = "postgresql"   // statt sqlite
  url      = env("DATABASE_URL")
}
```

Lokale `.env` zum Testen:
```env
DATABASE_URL="postgresql://...?sslmode=require"
```

Dann lokal migrieren:
```bash
npx prisma migrate dev --name init
npm run db:seed
```

---

## 3. VAPID-Keys einmalig erzeugen

```bash
node scripts/gen-vapid.mjs
```

Drei Zeilen erscheinen — `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Diese später in den Vercel-Env-Vars setzen.

---

## 4. Auf Vercel deployen (ca. 5 Min.)

1. Konto auf https://vercel.com (mit GitHub einloggen)
2. „Add New" → „Project" → Repository `Williberg-Schulbus` auswählen → Import
3. Framework: **Next.js** (wird automatisch erkannt)
4. **Build Command** belassen (`next build`)
5. „Environment Variables" — folgende eintragen:

   | Name | Wert |
   |---|---|
   | `DATABASE_URL` | Neon-Connection-String inkl. `?sslmode=require` |
   | `AUTH_SECRET` | 32+ zufällige Zeichen |
   | `ANTHROPIC_API_KEY` | `sk-ant-…` |
   | `ADMIN_REGISTRATION_CODE` | beliebig (z.B. `wiliberg-admin-2026`) |
   | `VAPID_PUBLIC_KEY` | aus `gen-vapid.mjs` |
   | `VAPID_PRIVATE_KEY` | aus `gen-vapid.mjs` |
   | `VAPID_SUBJECT` | `mailto:kanzlei@wiliberg.ch` |

6. „Deploy" klicken — nach ~3 Minuten ist die App online unter `https://<projekt>.vercel.app`.

### Admin anlegen
Nach erstem Deploy in der Vercel-Konsole das Seed-Skript einmal ausführen:

```bash
# Lokal (mit DATABASE_URL auf Neon-Connection-String):
npm run db:seed
```

Oder via Browser registrieren mit Admin-Code (aufgeklappt unter „Familie registrieren" → „Ich bin Mitglied des Gemeinderats").

---

## 5. Eigene Domain (optional)

Vercel → Projekt → Settings → Domains → `schulbus.wiliberg.ch` hinzufügen, dann beim DNS-Provider von wiliberg.ch einen CNAME auf `cname.vercel-dns.com` setzen. HTTPS richtet Vercel automatisch ein.

---

## 6. Erste Schritte in der App

1. Als Admin einloggen (`admin@wiliberg.ch` / `wiliberg-admin` — Passwort **sofort ändern**)
2. Unter **Fahrplan** Linien und Haltestellen anlegen (alle Haltestellen, die Eltern später auswählen sollen)
3. Optional: **Schulferien** für das Schuljahr eintragen
4. Optional: **Schulpläne** hochladen, KI-Analyse anstossen
5. Eltern einladen, sich unter `https://<deine-url>/register` zu registrieren

---

## 7. Datensparsamkeit / Schulbushandy

Die App ist explizit datensparsam:
- App-Shell wird einmal geladen (~120 kB), danach aus Cache
- Service Worker mit Stale-While-Revalidate für Navigation
- Keine externen Fonts, Tracker oder CDN-Bibliotheken
- Typischer Tagesverbrauch nach Erstinstallation: **< 1 MB**

Empfohlener Tarif Swisscom-Netz: **Wingo Swiss Mini** (CHF 13.95/Mt., 5 GB + Calls CH) oder **Migros Mobile** (gleich).

---

## 8. Backup

Neon erstellt automatisch Point-in-Time-Backups (7 Tage im Free-Tier). Für längeres Backup:

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## 9. Updates

```bash
git pull
npm install
npx prisma migrate deploy
```

Auf Vercel: einfach `git push` — automatischer Re-Deploy.

---

## Troubleshooting

| Problem | Lösung |
|---|---|
| `AUTH_SECRET fehlt oder ist zu kurz` | Mindestens 16 Zeichen in `.env` setzen, neu starten |
| Push aktiviert sich nicht | HTTPS nötig (Vercel ok); VAPID-Keys gesetzt? |
| KI-Analyse schlägt fehl | `ANTHROPIC_API_KEY` prüfen, Guthaben auf Console |
| Build-Fehler `provider = "postgresql"` | `npx prisma migrate dev --name init` lokal laufen, danach pushen |
| SQLite-Fehler auf Vercel | DB auf Postgres umgestellt? Siehe Schritt 2 |
