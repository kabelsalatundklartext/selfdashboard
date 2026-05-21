# Plugin: Kalender (`calendar`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Kalender-Widget mit **Monats- und Wochenansicht**, Tagesdetail und **Hintergrund-Synchronisation** für CalDAV- und ICS-Konten. Konten verwaltest du im **Kalender-Modal** (Zahnrad), nicht mehr in verstreuten Widget-JSON-Feldern.

### Installation

1. Plugin-Store → **Kalender** installieren → **Strg+F5**  
2. Widget aufs Dashboard legen  
3. Im Widget auf **⚙️** / Kalender-Icon → **Konten hinzufügen**

### Kontotypen

| Typ | Richtung | Typische Quellen |
|-----|----------|------------------|
| **CalDAV** | Zwei-Wege (lesen + schreiben) | Nextcloud, Synology, iCloud (App-Passwort), WEB.DE, … |
| **ICS / Webcal** | Nur lesen | Öffentliche oder private Abo-URL |

ICS-Feeds werden **serverseitig** abgerufen — LAN-URLs ohne Browser-CORS-Problem.

### Speicher & Sicherheit

| Thema | Details |
|-------|---------|
| **Pfad** | `data/calendar/` unter **`/app/data`** (Bind-Mount sichern!) |
| **Store** | `store.json` + Kalender-/Event-Daten |
| **Passwörter** | **AES-256-GCM** mit `SELFDASHBOARD_CALENDAR_KEY` |
| **Schlüssel** | In Docker **fest setzen**, damit Konten nach Container-Neustart entschlüsselbar bleiben |

### Oberfläche

- **Kachel:** kompakte Monatsansicht, Termine des Tages  
- **Vollbild:** erweiterte Ansicht über das Widget  
- **Sync:** Standard alle **5 Minuten** (`CALENDAR_SYNC_INTERVAL_SECONDS` am Server)  
- **Konflikte / Zusammenfassung:** über die Kalender-API (`/api/calendar/conflicts`, `summary`)

### API (Kern-App)

Einheitlich unter **`/api/calendar/*`** (keine alten `calendar-ics`-Routen mehr):

| Bereich | Beispiel |
|---------|----------|
| Konten | `GET/POST /api/calendar/accounts`, `…/accounts/[id]/sync` |
| Termine | `GET/POST /api/calendar/events` |
| Kalender | `GET /api/calendar/calendars` |
| Status | `GET /api/calendar/status` |

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Konten weg nach Update | `/app/data` gemountet? `SELFDASHBOARD_CALENDAR_KEY` unverändert? |
| Sync schlägt fehl | URL, Benutzer, App-Passwort; bei Synology CalDAV-Pfad prüfen |
| ICS leer | URL im Browser testen; Server muss Feed erreichen |

**Protokoll:** Filter Quelle/API oder Plugin `calendar`.

---

## English

CalDAV two-way + read-only ICS. Data in `data/calendar/` on the config volume. Account setup in the calendar modal (cog icon). Background sync every 5 minutes by default.
