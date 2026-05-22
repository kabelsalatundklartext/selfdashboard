# 📅 Calendar Plugin

CalDAV + ICS Kalender für SelfDashboard mit **Two-Way-Sync** zu iCloud,
Nextcloud, Fastmail, Posteo, mailbox.org und allen anderen CalDAV-fähigen
Anbietern. ICS-Feeds (Ferien, Geburtstage, Sport-Spielpläne) werden
read-only gespiegelt.

[🇩🇪 Deutsch](#deutsch) | [🇬🇧 English](#english)

---

## Deutsch

### Features

| Feature | Beschreibung |
| --- | --- |
| 🔄 **Two-Way CalDAV** | Termine anlegen / ändern / löschen — synchronisiert in beide Richtungen mit ETags |
| 📥 **ICS-Feeds** | Read-only Abonnements mit `If-None-Match`-Caching |
| 📦 **Offline-fähig** | Lokale JSON-Datei in `/app/data/calendar/store.json`; Edits werden bei nächster Verbindung gepusht |
| 🔐 **Verschlüsselte Passwörter** | App-Passwörter mit AES-256-GCM verschlüsselt; Key auto-generiert in `/app/data/calendar/.calendar-key` |
| ⚔️ **Konflikt-Erkennung** | Bei Server-seitiger Änderung gleichzeitig mit lokaler Änderung: Konflikt-UI mit "Local behalten" / "Remote behalten" |
| 🔁 **Recurrence** | RRULE-Expansion (daily / weekly / monthly / yearly) via `rrule` |
| 🌍 **i18n** | DE + EN, übernimmt Dashboard-Sprache |
| 🎨 **Themed** | Komplett über CSS-Variablen — passt zu Dark / Light / Nord / Catppuccin / Dracula / Solarized |
| 📱 **Responsive** | Reagiert auf `layoutMode` (`phone` / `tablet` / `desktop`) |

### UI

- **Compact Widget**: Heute-Count, Konflikte, nächste 5 Termine, Status-Punkt, Sync-/Settings-/Open-Buttons
- **Vollbild-Modal**: Monatsansicht (7×6 Grid), Agenda-Liste, Konten-Verwaltung
- **Event-Dialog**: Anlegen / Bearbeiten / Löschen + Konflikt-Auflösung
- **Account-Dialog**: CalDAV oder ICS hinzufügen (mit iCloud-Hinweis bei `caldav.icloud.com`)

### Anbieter-Hinweise

| Anbieter | URL-Form | Auth |
| --- | --- | --- |
| **iCloud** | `https://caldav.icloud.com/` | Apple-ID + **App-Passwort** (appleid.apple.com → „App-spezifische Passwörter") |
| **Nextcloud** | `https://cloud.example.com/remote.php/dav/` | Username + App-Passwort (Sicherheit → Geräte & Sessions) |
| **Fastmail** | `https://caldav.fastmail.com/dav/calendars/` | Username + App-Passwort |
| **Posteo** | `https://posteo.de:8443/` | Username + Passwort |
| **mailbox.org** | `https://dav.mailbox.org/caldav/` | Username + Passwort |
| **Google** | nicht unterstützt (braucht OAuth2 — kommt evtl. später) |

### Datenfluss

```
┌──────────────────┐   POST /api/calendar/events      ┌──────────────────┐
│  Widget / Modal  │ ───────────────────────────────► │  Route Handler   │
│ (React Client)   │                                  │  (Next.js Server) │
└──────────────────┘                                  └────────┬─────────┘
         ▲                                                     │
         │ GET /api/calendar/summary                           ▼
         │                                       ┌─────────────────────────┐
         │                                       │  store.ts               │
         │                                       │  /app/data/calendar/    │
         │                                       │    store.json           │
         └───────────────────────────────────────┘    .calendar-key        │
                                                 └────────┬─────────┘
                                                          │
                                                  Background scheduler
                                                  (jede 5 Min)
                                                          ▼
                                                 ┌────────────────────┐
                                                 │ tsdav → CalDAV     │
                                                 │ fetch → ICS-Feed   │
                                                 └────────────────────┘
```

### V1-Einschränkungen

- Editieren einer **wiederkehrenden** Serie betrifft die **ganze** Serie (keine „nur dieser Termin" / „diese und alle folgenden")
- Bei bearbeiteten Events gehen `X-*`-Properties verloren (im Original bleiben sie erhalten)
- **Keine** VALARM-Push-Notifications im Browser
- **Kein** RSVP / Attendees-Workflow
- UTC-Storage, Rendering in Browser-Locale
- **Kein** Google Calendar / Microsoft Graph (würde OAuth2 brauchen)

### Storage-Schema (`store.json`)

```typescript
{
  version: 1,
  accounts: Account[],         // { id, provider, name, config (verschlüsselt), … }
  calendars: Calendar[],       // { id, accountId, name, color, hidden, … }
  events: CalendarEvent[],     // { id, calendarId, uid, icalData, syncState, … }
  syncLog: SyncLogEntry[],     // letzte 50 Sync-Läufe
}
```

### Env-Variablen

| Variable | Default | Beschreibung |
| --- | --- | --- |
| `CALENDAR_DATA_DIR` | `${SELFDASHBOARD_DATA_DIR}/calendar` oder `/app/data/calendar` | Storage-Pfad |
| `CALENDAR_SYNC_INTERVAL_SECONDS` | `300` | Background-Sync-Intervall |
| `SELFDASHBOARD_CALENDAR_KEY` | (auto-generiert) | AES-256-Key (hex) für Passwort-Verschlüsselung |

---

## English

### Features

| Feature | Description |
| --- | --- |
| 🔄 **Two-Way CalDAV** | Create / edit / delete events — synced bidirectionally with ETags |
| 📥 **ICS feeds** | Read-only subscriptions with `If-None-Match` caching |
| 📦 **Offline-capable** | Local JSON in `/app/data/calendar/store.json`; edits pushed when back online |
| 🔐 **Encrypted passwords** | App-passwords sealed with AES-256-GCM; key auto-generated under `/app/data/calendar/.calendar-key` |
| ⚔️ **Conflict detection** | Server-side change colliding with a local edit → conflict UI ("keep local" / "keep remote") |
| 🔁 **Recurrence** | RRULE expansion (daily / weekly / monthly / yearly) via `rrule` |
| 🌍 **i18n** | DE + EN, follows dashboard language |
| 🎨 **Themed** | Pure CSS variables — fits Dark / Light / Nord / Catppuccin / Dracula / Solarized |
| 📱 **Responsive** | Honours `layoutMode` (`phone` / `tablet` / `desktop`) |

### V1 limitations

- Editing a **recurring** series edits the **whole** series (no "this occurrence only" yet)
- Edited events lose `X-*` props (preserved on un-edited)
- No browser VALARM push notifications
- No RSVP / attendees workflow
- UTC storage, browser-local rendering
- No Google Calendar / Microsoft Graph (needs OAuth2 — future work)
