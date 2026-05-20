# Hinweise für Claude Code Desktop

Dieses Repo enthält **Schulbus Wiliberg** — eine installierbare PWA für die Gemeinde Wiliberg (AG). Die App ist vollständig implementiert und gebaut, sie muss nur noch in die Cloud gebracht werden.

## Was der User braucht

Den User durch das **Deployment auf Vercel + Neon Postgres** führen. Komplette Schritt-für-Schritt-Anleitung steht in [`DEPLOY.md`](./DEPLOY.md).

## Status des Codes

- Next.js 15 App-Router, TypeScript, Tailwind, Prisma. Build läuft sauber durch (`npx next build`).
- Schema steht in `prisma/schema.prisma` — Provider muss für Produktion auf `postgresql` umgestellt werden (Hinweis-Kommentar im Schema).
- VAPID-Keys werden lokal einmalig mit `node scripts/gen-vapid.mjs` erzeugt.
- Icons werden aus `public/wappen.svg` mit `node scripts/gen-icons.mjs` generiert (läuft auch im Build).

## Deployment-Schritte (Kurzfassung)

1. **Neon Postgres** (https://neon.tech):
   - Konto anlegen, Projekt „schulbus-wiliberg", Region **Frankfurt**
   - Connection-String kopieren (inkl. `?sslmode=require`)
2. **`prisma/schema.prisma`** Provider von `sqlite` auf `postgresql` umstellen
3. **Lokal Migration erzeugen**:
   ```bash
   DATABASE_URL="<neon-string>" npx prisma migrate dev --name init
   git add prisma/migrations && git commit -m "Initial Postgres-Migration" && git push
   ```
4. **VAPID-Keys**:
   ```bash
   node scripts/gen-vapid.mjs
   ```
5. **Vercel** (https://vercel.com):
   - Repo importieren (Framework: Next.js)
   - Env-Vars setzen (siehe `DEPLOY.md` Schritt 4)
   - „Deploy"
6. **Seed** nach erstem Deploy:
   ```bash
   DATABASE_URL="<neon-string>" npm run db:seed
   ```
   Default-Admin: `admin@wiliberg.ch` / `wiliberg-admin` → **Passwort sofort ändern**
7. Optional: Eigene Domain `schulbus.wiliberg.ch` → Vercel Settings → Domains

## Sensible Daten

- **Keine** API-Keys, DB-Strings, VAPID-Private-Keys ins Repo committen — alles in `.env` lokal bzw. in Vercel-Env-Vars
- `.env` und `.env.local` sind in `.gitignore`

## Häufige Stolpersteine

| Problem | Lösung |
|---|---|
| Build-Fehler „provider postgresql but DB is sqlite" | Schema umgestellt aber Migration vergessen — `prisma migrate dev` lokal |
| Push funktioniert nicht | VAPID-Keys gesetzt? HTTPS aktiv? Browser-Permission erteilt? |
| KI-Analyse fehlgeschlagen | `ANTHROPIC_API_KEY` gesetzt, Guthaben auf console.anthropic.com prüfen |
| Vercel-Build timeout bei Icon-Generierung | `sharp` ist als Dependency drin, sollte funktionieren; sonst Icons committen |
