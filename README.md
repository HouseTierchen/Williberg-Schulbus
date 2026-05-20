# Schulbus Wiliberg

Schulbus-Portal der Gemeinde Wiliberg (AG) als **installierbare Progressive Web App** (PWA) für Eltern und Gemeinderat. Designt mit dem Ziel, Petra Grädel-Fretz (Vizeammann, Ressort Bildung) und Frey Reisen die manuelle Planung weitestgehend abzunehmen.

> 🚀 **Du willst die App live schalten?** → siehe [`DEPLOY.md`](./DEPLOY.md) für eine 15-Minuten-Anleitung auf Vercel + Neon (gratis).

## Highlights

- **KI-Auswertung** der Schulpläne — Stundenplan als **PDF oder Foto** hochladen, Claude liest Unterrichtszeiten aus und schlägt Bus-Fahrzeiten vor.
- **Eltern-Dashboard** pro Familie:
  - Kinder einpflegen
  - Wochen-Bedarf pro Tag und Slot (morgens hin, mittags rück, nachmittags rück) mit Haltestellen-Auswahl aus admin-gepflegter Liste
  - „Heute krank" Schnellbutton (1 Klick + automatische Benachrichtigung)
  - Krankmeldung / Abmeldung über Zeitraum
  - Geschwister-Kopie: Bedarf eines Geschwisters in einem Klick übernehmen
- **Admin (Gemeinderat) Dashboard**:
  - Tagesplan, der Wochen-Bedarf, Spezialwochen, Ferien und Abmeldungen kombiniert
  - **Wochenliste / CSV-Export** für Frey Reisen (druckbar, fertig)
  - Lücken-Anzeige: welche Kinder haben keinen Bedarf gepflegt
  - Spezialwochen (Projekt-/Sportwochen) mit kindbezogenen Overrides
  - Schulferien / schulfreie Tage
  - Fahrplan-Verwaltung (Linien, Haltestellen, Fahrten)
  - Sammelmitteilungen an alle Eltern mit Push-Versand
- **Push-Benachrichtigungen** (Web-Push / PWA) — Eltern bekommen automatisch Info bei Spezialwochen, Admins bei Krankmeldungen.
- **Installierbar** auf Handy/Desktop (Android/iOS/Win/Mac/Linux) mit Wappen-Icon und Offline-Fallback.
- **Datensparsam** — App-Shell wird einmal geladen, danach aus Cache; keine externen Fonts/Tracker/CDNs. Geeignet für günstige Mobile-Tarife.
- **Design** orientiert am Wappen Wiliberg (Weiss/Blau, grüne Rebe, goldenes Mühlrad) und Slogan „Eifach schön!".

## Stack

- Next.js 15 (App Router, TypeScript) + Tailwind CSS
- Prisma (SQLite lokal, Postgres in Produktion)
- JWT-Cookies (`jose`) + bcrypt
- `@anthropic-ai/sdk` (Claude, mit PDF-/Vision-Support)
- `web-push` für Browser-Benachrichtigungen
- PWA: Manifest + Service Worker + automatisch generierte Wappen-Icons

## Schnellstart lokal

```bash
cp .env.example .env       # Werte eintragen (s.u.)
npm install
node scripts/gen-vapid.mjs # einmalig: VAPID-Keys, in .env eintragen
npm run db:push
npm run db:seed            # Admin: admin@wiliberg.ch / wiliberg-admin
npm run dev                # http://localhost:3000
```

### Wichtige .env-Variablen

| Variable | Bedeutung |
|---|---|
| `DATABASE_URL` | Prisma-DB-URL (default SQLite `file:./dev.db`) |
| `AUTH_SECRET` | Geheimer Schlüssel für Session-JWT (mind. 32 Zeichen) |
| `ANTHROPIC_API_KEY` | API-Key für die KI-Auswertung der Schulpläne |
| `ADMIN_REGISTRATION_CODE` | Code, mit dem sich ein Gemeinderats-Mitglied selbst als Admin registrieren kann |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web-Push (Browser-Notifications). Mit `node scripts/gen-vapid.mjs` einmalig erzeugen. |

## Workflow für Petra (Gemeinderat)

1. **Einmalig**: Fahrplan-Linien und Haltestellen anlegen, Schulferien eintragen
2. **Pro Semester**: Stundenplan-PDF hochladen → KI extrahiert Zeiten
3. **Eltern erfassen Bedarf selbst** – Petra sieht im Dashboard, wer noch offen ist
4. **Krankmeldungen** kommen automatisch rein (Push-Notification)
5. **Wochenliste / CSV** für Frey Reisen exportieren statt manuell zusammenstellen
6. **Spezialwochen/Projektwochen**: Aktivieren → alle Eltern werden per Push informiert, Overrides pflegen
7. **Sammelmitteilungen** (z.B. „Bus verspätet") an alle Eltern mit einem Klick

## Datensparsamkeit

Die App ist explizit auf geringen Datenverbrauch ausgelegt:
- App-Shell wird beim ersten Besuch gecacht, danach offline verfügbar
- Service Worker mit Stale-While-Revalidate-Strategie
- Keine externen Schriften, keine Tracker, kein CDN-Loading
- Wappen und Icons als optimierte SVG/PNG

Typischer Datenverbrauch eines Schulbushandys (z.B. Frey-Reisen-Fahrzeug): **< 1 MB pro Tag** nach Erstinstallation. Empfohlener Tarif auf Swisscom-Netz: **Wingo Swiss Mini** (CHF 13.95/Mt., 5 GB).

## Lizenz / Auftraggeber

Im Auftrag der Einwohnergemeinde Wiliberg.

© Einwohnergemeinde Wiliberg · Eifach schön!
