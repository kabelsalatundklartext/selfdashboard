# 📦 Calendar Plugin — Installation & PR-Guide

Schritt-für-Schritt-Anleitung um das Calendar-Plugin in dein
SelfDashboard-Fork zu integrieren und einen Pull Request ans Haupt-Repo
zu stellen.

---

## 1. Fork & Branch

```bash
# In GitHub: kabelsalatundklartext/selfdashboard → "Fork" oben rechts

git clone https://github.com/<DEIN-USER>/selfdashboard.git
cd selfdashboard
git checkout -b feat/calendar-plugin
```

## 2. Dateien einfügen

Aus dem ZIP-Archiv folgendermaßen kopieren:

```
ZIP-Inhalt                                       →  Ziel im Repo
─────────────────────────────────────────────────────────────────────────────
plugins/calendar/                                →  plugins/calendar/
src/lib/calendar/                                →  src/lib/calendar/
src/app/api/calendar/                            →  src/app/api/calendar/
src/instrumentation.ts                           →  src/instrumentation.ts  (siehe ⚠️)
```

⚠️ **Wenn `src/instrumentation.ts` bei dir schon existiert:** öffne deine
Version und füge **nur** den Inhalt der `register()`-Funktion aus dem
mitgelieferten File hinzu (siehe **Schritt 5**).

## 3. Dependencies hinzufügen

In `package.json` unter `"dependencies"`:

```json
{
  "dependencies": {
    "tsdav": "^2.1.5",
    "ical.js": "^2.1.0",
    "rrule": "^2.8.1"
  }
}
```

Dann:

```bash
npm install
```

| Package | Zweck | Warum diese Wahl? |
| --- | --- | --- |
| `tsdav` | CalDAV-Client für Node | Aktive Maintenance, TypeScript-native, unterstützt sync-collection report |
| `ical.js` | iCalendar Parse/Build | Mozillas Library, wird auch von Thunderbird genutzt |
| `rrule` | RRULE-Expansion | De-facto-Standard für Recurrence in JS |

Crypto verwendet **nur** das eingebaute `node:crypto` — keine extra
Dependency.

## 4. Plugin registrieren

In `src/lib/pluginLoader.ts`, ganz oben bei den anderen Imports:

```ts
import * as calendarPlugin from '../../plugins/calendar'
```

In der `loadBuiltinPlugins()`-Funktion (an passender Stelle bei den
anderen `registerPlugin`-Aufrufen):

```ts
registerPlugin(calendarPlugin.meta, calendarPlugin.component)
```

## 5. Background-Scheduler starten

Damit der CalDAV-Sync alle 5 Minuten automatisch läuft:

**Wenn `src/instrumentation.ts` noch nicht existiert:**

```ts
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/lib/calendar/sync')
    startScheduler()
  }
}
```

**Wenn die Datei schon existiert**, in die bestehende `register()`
einfügen:

```ts
export async function register() {
  // ... bestehender Code ...

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/lib/calendar/sync')
    startScheduler()
  }
}
```

In `next.config.js` muss bei älteren Next-Versionen
`experimental.instrumentationHook: true` gesetzt sein — bei **Next 15
ist das default** und kann weggelassen werden.

## 6. Lokal testen

```bash
npm run dev
```

Browser öffnen: `http://localhost:3000`

1. Dashboard öffnen → **+** Button → **Kalender** im Plugin-Store anklicken
2. Widget erscheint auf dem Dashboard
3. Auf Widget klicken → Vollbild-Modal öffnet sich
4. Reiter **Konten** → **+ CalDAV** oder **+ ICS** klicken
5. Verbindung testen (Button **Testen**) — wenn ok, speichern
6. Sync startet automatisch im Hintergrund

### iCloud-Test mit App-Passwort

1. https://appleid.apple.com → Anmelden → **App-spezifische Passwörter** → **Neues erstellen**
2. Name: „SelfDashboard Calendar"
3. Im Plugin: URL = `https://caldav.icloud.com/`, Username = deine Apple-ID-E-Mail, Passwort = das generierte App-Passwort

### ICS-Test ohne Account

Beliebigen öffentlichen ICS-Feed nutzen, z.B.:
- Schulferien: https://www.schulferien.org/iCal/Ferien/
- Feiertage: https://calendar.google.com/calendar/ical/de.german%23holiday%40group.v.calendar.google.com/public/basic.ics

## 7. Build-Check

```bash
npm run build
```

Sollte ohne TypeScript-Errors durchlaufen.

## 8. Commit & Push

```bash
git add plugins/calendar src/lib/calendar src/app/api/calendar \
        src/instrumentation.ts src/lib/pluginLoader.ts package.json package-lock.json
git commit -m "feat(plugins): add calendar plugin with CalDAV two-way sync + ICS"
git push origin feat/calendar-plugin
```

## 9. PR öffnen

1. https://github.com/<DEIN-USER>/selfdashboard öffnen
2. Banner „Compare & pull request" oder Tab **Pull requests** → **New pull request**
3. Base: `kabelsalatundklartext/selfdashboard:main` ← Head: `<DEIN-USER>/selfdashboard:feat/calendar-plugin`
4. Beschreibung aus `PR_BODY.md` kopieren
5. **Create pull request**

---

## Optional: docs/CHANGELOG.md ergänzen

```markdown
## Unreleased

### Added
- **📅 Calendar Plugin** — Two-way CalDAV sync (iCloud, Nextcloud, Fastmail, Posteo, mailbox.org …) and read-only ICS feeds. Local JSON storage in `/app/data/calendar/`. AES-256-GCM encrypted credentials. Conflict detection with manual resolution. Compact widget + full-screen month/agenda view. Background sync every 5 min (configurable via `CALENDAR_SYNC_INTERVAL_SECONDS`).
```

## Optional: README.md ergänzen

In den „Available Plugins" / „Verfügbare Plugins" Tabellen:

```markdown
| 📅 Kalender | Productivity | CalDAV (iCloud, Nextcloud, …) Two-Way-Sync + ICS-Feeds | ✅ Included |
```

---

## Files Manifest

Alle Pfade relativ zum Repo-Root:

```
plugins/calendar/
├── README.md                                  (Plugin-Doku)
├── api-client.ts                              (Typed fetch wrapper)
├── i18n.ts                                    (DE/EN strings)
└── index.tsx                                  (Widget + Settings + Modal)

src/lib/calendar/
├── api-helpers.ts                             (NextResponse helpers)
├── caldav.ts                                  (CalDAV provider, tsdav)
├── crypto.ts                                  (AES-256-GCM)
├── ical.ts                                    (iCalendar parse/build)
├── ics.ts                                     (ICS feed provider)
├── store.ts                                   (JSON storage, async mutex)
├── sync.ts                                    (Orchestrator + scheduler)
└── types.ts                                   (Shared TypeScript types)

src/app/api/calendar/
├── accounts/route.ts                          (GET, POST)
├── accounts/[id]/route.ts                     (PUT, DELETE)
├── accounts/[id]/sync/route.ts                (POST — manual sync)
├── accounts/[id]/test/route.ts                (POST — test connection)
├── calendars/route.ts                         (GET)
├── calendars/[id]/route.ts                    (PUT — color/visibility)
├── conflicts/route.ts                         (GET)
├── conflicts/[id]/route.ts                    (POST — resolve)
├── events/route.ts                            (GET, POST)
├── events/[id]/route.ts                       (PUT, DELETE)
├── status/route.ts                            (GET)
└── summary/route.ts                           (GET — widget payload)

src/instrumentation.ts                         (Scheduler start hook)
```

---

## Troubleshooting

| Problem | Lösung |
| --- | --- |
| `Cannot find module 'tsdav'` | `npm install` vergessen — Step 3 |
| Widget zeigt „nicht verbunden" | Browser-DevTools → Network: spricht `/api/calendar/summary` an? Wenn 500: Server-Logs prüfen |
| `Plugin nicht im Store` | `pluginLoader.ts` Eintrag fehlt oder `npm run build` nicht ausgeführt — Step 4 |
| iCloud-Sync schlägt fehl | App-Passwort verwendet, nicht normales Passwort? App-Passwörter haben Format `xxxx-xxxx-xxxx-xxxx` |
| Nextcloud 401 | URL muss auf `/remote.php/dav/` enden, **nicht** auf `/principals/users/<name>` |
| Background-Sync läuft nicht | `src/instrumentation.ts` vorhanden? Schedule-Intervall via `CALENDAR_SYNC_INTERVAL_SECONDS` (Default 300s) |
| Konfliktmarker bleibt | Konflikt manuell auflösen über das Modal — Ein Event in `conflict`-State wird nicht weiter gesynct bis aufgelöst |
