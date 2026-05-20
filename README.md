# Schulbus Wiliberg

Schulbus-Portal der Gemeinde Wiliberg (AG) – als **installierbare Progressive Web App** (PWA) für Eltern und Gemeinderat.

- **KI-Auswertung** von Schulplänen / Stundenplänen (Claude über Anthropic SDK)
- **Eltern-Dashboard**: Familien-Registrierung, Kinder einpflegen, Krankmeldungen
- **Admin-Dashboard** für den Gemeinderat: Fahrplan, Linien, Haltestellen, Familienübersicht, Tages-Abmeldungen
- **Installierbar** auf jedem Handy (Android/iOS) und Desktop – mit Service Worker und Offline-Fallback
- Optik orientiert sich am Wappen Wiliberg (Weiss/Blau, mit grüner Rebe und goldenem Mühlrad) und dem Slogan **„Eifach schön!"**

## Highlights

- **Push-Benachrichtigungen** (Web-Push / PWA): Eltern & Gemeinderat aktivieren Benachrichtigungen mit einem Klick. Trigger: Krankmeldungen → an Admin, neue Spezialwoche → an alle Eltern.
- **„Heute krank" Schnellbutton** auf jedem Kind im Dashboard – ein Klick → Eintrag + Push an Admin.
- **PDF/Bild-Upload für Stundenpläne**: Schulplan einfach hochladen, Claude liest direkt aus (Document- bzw. Vision-Modus).
- **Geschwister-Kopie**: Bedarf eines Geschwisters in einem Klick übernehmen.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Prisma + SQLite (für Produktion einfach auf Postgres umstellbar)
- JWT-Cookies (jose) + bcrypt
- Anthropic SDK (`@anthropic-ai/sdk`)
- PWA: Web-Manifest + Service Worker + Wappen-Icons

## Setup

```bash
cp .env.example .env        # Werte eintragen (AUTH_SECRET, ANTHROPIC_API_KEY)
npm install
npm run db:push             # SQLite-Datenbank anlegen
npm run db:seed             # Admin anlegen: admin@wiliberg.ch / wiliberg-admin
npm run dev
```

App läuft unter http://localhost:3000.

### Wichtige .env-Variablen

| Variable | Bedeutung |
|---|---|
| `DATABASE_URL` | Prisma-DB-URL (default SQLite `file:./dev.db`) |
| `AUTH_SECRET` | Geheimer Schlüssel für Session-JWT (mind. 32 Zeichen) |
| `ANTHROPIC_API_KEY` | API-Key für die KI-Auswertung der Schulpläne |
| `ADMIN_REGISTRATION_CODE` | Code, mit dem sich ein Gemeinderats-Mitglied selbst als Admin registrieren kann |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web-Push (Browser-Notifications). Mit `node scripts/gen-vapid.mjs` einmalig erzeugen. |

## Bedienung

### Eltern
1. **Familie registrieren** → ein Konto pro Familie
2. **Kind hinzufügen** (Schule, Klasse, bevorzugte Haltestelle)
3. **Krankmeldung / Abmeldung** mit Zeitraum und Grund erfassen
4. **Fahrplan** auf der Startseite sichtbar

### Admin (Gemeinderat)
1. Anmeldung als Admin (Seed: `admin@wiliberg.ch` / `wiliberg-admin`)
2. **Schulpläne** anlegen – Text einfügen → KI-Analyse → Vorschläge für Bus-Fahrten
3. **Fahrplan** verwalten: Linien, Haltestellen, Fahrten (Mo–Fr, Hin/Rück)
4. **Familien** & **Tages-Abmeldungen** einsehen

### KI-Auswertung
Der Stundenplan-Text wird an Claude geschickt. Die KI gibt zurück:
- Zusammenfassung
- Strukturierte Unterrichtszeiten (Klasse · Tag · Start/Ende)
- Empfohlene Bus-Fahrzeiten (ca. 20 Min. vor Unterrichtsbeginn / 10 Min. nach Unterrichtsende)

## PWA / Installation

- Web-Manifest: `/manifest.webmanifest`
- Service Worker: `/sw.js` (App-Shell-Cache mit Offline-Fallback)
- Icons werden beim Build aus `public/wappen.svg` generiert (Skript `scripts/gen-icons.mjs`)
- Im Browser erscheint automatisch ein **„Installieren"-Banner** (Android/Chrome/Edge). Unter iOS Safari: *Teilen → Zum Home-Bildschirm hinzufügen*

## Hinweise zur Produktion

- `DATABASE_URL` auf Postgres umstellen (z.B. `postgresql://…`) und `provider` in `prisma/schema.prisma` anpassen
- Hosting: Vercel, Render, eigener Node-Server – HTTPS ist Pflicht für PWA-Installation und Service Worker
- Backups der DB regelmässig sichern
- `AUTH_SECRET` und `ADMIN_REGISTRATION_CODE` rotieren

---

© Einwohnergemeinde Wiliberg · Eifach schön!
