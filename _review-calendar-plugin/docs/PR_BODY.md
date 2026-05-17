# 📅 Add Calendar Plugin (CalDAV two-way sync + ICS feeds)

Adds a calendar widget to SelfDashboard that syncs bidirectionally with
CalDAV providers (iCloud, Nextcloud, Fastmail, Posteo, mailbox.org …)
and mirrors read-only ICS feeds (holidays, sports schedules, …).

[🇩🇪 Deutsche Zusammenfassung weiter unten](#deutsche-zusammenfassung)

---

## What's new

| Item | Description |
| --- | --- |
| 🧩 Plugin folder | `plugins/calendar/` — Widget, Settings, full-screen modal, dialogs, i18n |
| 🛠️ Server lib | `src/lib/calendar/` — store, crypto, providers (CalDAV via `tsdav`, ICS via `fetch`), iCal parse/build, sync orchestrator |
| 🌐 API routes | `src/app/api/calendar/` — accounts, calendars, events, conflicts, summary, status |
| ⏰ Scheduler | `src/instrumentation.ts` adds a 5-min background sync (configurable) |
| 🔌 Loader | One import + one `registerPlugin(...)` in `src/lib/pluginLoader.ts` |

## Features

- **Two-way CalDAV** — create/edit/delete events stay in sync, ETag-based conflict detection
- **ICS feeds** — read-only, conditional GET (`If-None-Match`) to avoid bandwidth
- **Offline-capable** — local edits queued in `local_new` / `local_modified` / `local_deleted` states, pushed on next sync
- **Conflict resolution UI** — when remote and local change collide, the user picks which version wins
- **Recurring events** — RRULE expansion (daily/weekly/monthly/yearly) via `rrule`
- **Encrypted credentials** — passwords sealed with AES-256-GCM (`node:crypto`), key auto-generated and chmod-600 in data dir
- **Themed** — pure CSS variables, fits all 6 SelfDashboard themes
- **Responsive** — honours `layoutMode` (`phone` / `tablet` / `desktop`)
- **i18n** — DE + EN, follows dashboard language

## UI

- **Compact widget** — today count, conflict count, next 5 events, status dot, sync/settings/open buttons
- **Full-screen modal** — month grid (7×6), agenda list, accounts manager, event dialog, account dialog

## New dependencies

```json
{
  "tsdav":   "^2.1.5",
  "ical.js": "^2.1.0",
  "rrule":   "^2.8.1"
}
```

No Python, no extra services, no database — pure Node + JSON file in `/app/data/calendar/`.

## Storage

Single file: `${SELFDASHBOARD_DATA_DIR:-/app/data}/calendar/store.json`

```typescript
{
  version: 1,
  accounts:  Account[],       // CalDAV / ICS accounts
  calendars: Calendar[],      // discovered or imported calendars
  events:    CalendarEvent[], // local + synced events with syncState
  syncLog:   SyncLogEntry[],  // last 50 sync runs
}
```

Atomic writes (tmp + rename), in-process async mutex, corrupt-file backup
on parse error. Encryption key in `.calendar-key` (chmod 600) next to
the store, or override via `SELFDASHBOARD_CALENDAR_KEY` env.

## API surface

All under `/api/calendar/`:

| Method | Path | Purpose |
| --- | --- | --- |
| GET / POST | `/accounts` | List, create |
| PUT / DELETE | `/accounts/[id]` | Update, remove (cascades) |
| POST | `/accounts/[id]/sync` | Manual sync |
| POST | `/accounts/[id]/test` | Test connection without persisting |
| GET | `/calendars` | List all |
| PUT | `/calendars/[id]` | Color / visibility / name |
| GET / POST | `/events?start=&end=&calendarId=` | List (expands recurrences), create |
| PUT / DELETE | `/events/[id]` | Update, delete (soft until synced) |
| GET | `/conflicts` | List conflicts |
| POST | `/conflicts/[id]` | Resolve `{side: 'local' \| 'remote'}` |
| GET | `/summary` | Widget payload (today, next 7 days, counts) |
| GET | `/status` | Accounts, recent runs, pending, conflicts |

## How to test

1. `npm install`
2. `npm run dev`
3. Open dashboard → **+** → **Kalender**
4. Click the widget → modal → **Konten** tab → **+ CalDAV** or **+ ICS**

### iCloud test (requires app-specific password)
- URL: `https://caldav.icloud.com/`
- User: Apple-ID email
- Pass: app-specific password from appleid.apple.com (not the regular Apple-ID password!)

### ICS test (no auth needed)
Use any public feed, e.g. https://www.schulferien.org/iCal/Ferien/

## V1 limitations (documented in `plugins/calendar/README.md`)

- Editing a **recurring** series edits the **whole** series (no "this occurrence only")
- Edited events lose `X-*` props (preserved on un-edited)
- No browser VALARM push notifications
- No RSVP / attendees workflow
- UTC storage, browser-local rendering
- No Google Calendar / Microsoft Graph (would need OAuth2 — future PR)

## Files added/changed

```
plugins/calendar/                    [NEW] 4 files, ~1500 lines
src/lib/calendar/                    [NEW] 8 files, ~1200 lines
src/app/api/calendar/                [NEW] 12 route handlers, ~600 lines
src/instrumentation.ts               [NEW or PATCHED] +5 lines
src/lib/pluginLoader.ts              [PATCHED] +2 lines
package.json                         [PATCHED] +3 deps
docs/CHANGELOG.md                    [PATCHED] +1 entry
README.md                            [PATCHED] +2 table rows (EN+DE)
```

## Compatibility

- Next.js 15 (uses async `params` route handler signature)
- React 18+
- Node 20 (matches the existing Alpine base image)
- No new runtime services, no new ports
- Existing `/app/data` bind-mount is reused

## Security

- Passwords AES-256-GCM, key in chmod-600 file (auto-generated)
- No password ever logged or returned via API (`toAccountView` strips it)
- Same-origin only, no third-party scripts
- HTTPS verification on by default; user can opt-out per CalDAV account

---

## Deutsche Zusammenfassung

### Was kommt rein

Ein Kalender-Plugin für SelfDashboard mit **Two-Way CalDAV-Sync**
(iCloud, Nextcloud, Fastmail, Posteo, mailbox.org …) und **ICS-Feeds**
read-only (Ferien, Geburtstage, Spielpläne).

### Features

- **Two-Way CalDAV** mit ETag-Konflikterkennung
- **ICS-Feeds** mit Conditional GET
- **Offline-fähig** — lokale Edits werden gepusht sobald wieder Verbindung da ist
- **Konflikt-UI** mit „Local behalten / Remote behalten"
- **Wiederkehrende Termine** (RRULE via `rrule`)
- **Verschlüsselte Passwörter** (AES-256-GCM, eingebautes `node:crypto`)
- **Themed** — reine CSS-Variablen, passt zu allen 6 SelfDashboard-Themes
- **Responsive** für Phone / Tablet / Desktop
- **i18n DE/EN**

### UI

- **Compact Widget** mit Heute-Count, Konflikten, nächste 5 Termine
- **Vollbild-Modal** mit Monatsansicht (7×6), Agenda, Konten-Manager

### Speicherung

`${SELFDASHBOARD_DATA_DIR:-/app/data}/calendar/store.json` — eine einzige
JSON-Datei mit atomischen Writes. Verschlüsselungs-Key in
`.calendar-key` (chmod 600) im selben Ordner.

### Test mit iCloud

1. https://appleid.apple.com → **App-spezifische Passwörter** generieren
2. Im Plugin: URL = `https://caldav.icloud.com/`, User = Apple-ID-E-Mail, Passwort = das App-Passwort (Format `xxxx-xxxx-xxxx-xxxx`)

### V1-Einschränkungen

- Recurring-Edits betreffen die ganze Serie
- Editierte Events verlieren `X-*`-Properties
- Keine VALARM-Push-Notifications
- Kein RSVP / Attendees
- Kein Google Calendar (braucht OAuth2 — späterer PR)

### Dependencies

```json
"tsdav": "^2.1.5", "ical.js": "^2.1.0", "rrule": "^2.8.1"
```

Kein Python, kein extra Service, keine DB.
