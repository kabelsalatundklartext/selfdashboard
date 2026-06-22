# Plugin: SelfMailer Kalender (`selfmailer-calendar`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **kommende Termine aus SelfMailer** und legt **neue Termine direkt in SelfMailer** an.
Wählt man als Ziel einen Google-Kalender, schreibt SelfMailer den Termin automatisch
auch nach Google (Zwei-Wege-Sync auf der SelfMailer-Seite). SelfMailer bleibt die
einzige Datenquelle — das Dashboard hat **keinen** eigenen Kalenderspeicher.

### Installation

Plugin-Store → **SelfMailer Kalender** → **Strg+F5** → im Widget-Einstellungen
**Basis-URL** und **Token** eintragen (derselbe Token wie beim SelfMailer-Mail-Widget,
aus *SelfMailer → Einstellungen → Feeds/Export*).

### Funktionen

- Kommende Termine, nach Tag gruppiert (Heute/Morgen/…); Farbpunkt = Quell-Kalender.
- **＋ Termin**: Titel, Datum, optional Uhrzeit (leer = ganztägig), Ziel-Kalender
  (Lokal oder ein beschreibbarer Google-Kalender). Anlegen → SelfMailer → Google.
- Zeitraum (Tage) und Standard-Ziel-Kalender konfigurierbar.

### Voraussetzung

SelfMailer ab der Version mit token-fähiger Kalender-API
(`/api/v1/calendar/events` akzeptiert `?token=`, plus `/api/v1/calendar/targets`).

### Sicherheit

- Token bleibt serverseitig (Proxy `/api/plugins/selfmailer-calendar`), kein
  Direktzugriff aus dem Browser; ausgehende Requests laufen über den SSRF-Guard.

---

## English

Shows **upcoming SelfMailer events** and creates **new events directly in SelfMailer**.
Pick a Google calendar as target and SelfMailer pushes the event to Google
automatically. SelfMailer stays the single source of truth — the dashboard keeps
no calendar store of its own.

Settings: SelfMailer **base URL** + **token** (same token as the mail widget).
The **＋** button adds an event (title, date, optional time = all-day when empty,
target calendar). Requires a SelfMailer build with the token-capable calendar API.
