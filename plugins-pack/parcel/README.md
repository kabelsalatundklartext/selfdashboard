# Plugin: Paketverfolgung (`parcel`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

Kostenlose Multi-Carrier-Sendungsverfolgung **ohne API-Key** — fragt die login-freien öffentlichen Endpunkte ab, die die Carrier selbst für ihre Tracking-Seiten nutzen. Server-Logik: `plugins-pack/parcel/server.ts`.

## Deutsch

### Unterstützte Anbieter

| Anbieter | Status | Endpunkt (login-frei) |
|----------|--------|------------------------|
| **DHL** | ✅ stabil | `www.dhl.de/int-verfolgen/data/search` |
| **Hermes** | ✅ stabil | `api.my-deliveries.de/tnt/parcelservice/parceldetails` |
| **DPD** | ⚠️ best-effort | `tracking.dpd.de/rest/plc/de_DE` — Akamai-Bot-Schutz kann den Abruf blockieren |
| **GLS** | ❌ nicht möglich | GLS hat seinen freien Endpunkt 2024/25 abgeschaltet (Login/API-Key nötig) |

**Auto** probiert DHL → Hermes → DPD und nimmt den ersten Treffer.

### Bedienung

- **Direkt im Widget hinzufügen:** unten Sendungsnummer eintippen, Anbieter wählen (oder *Auto*), **+** (oder Enter).
- **Löschen:** Mülltonnen-Icon rechts an jeder Sendung.
- **Beim Anbieter ansehen ↗:** öffnet die offizielle Tracking-Seite des Anbieters mit der Nummer — dort der vollständige Verlauf.
- **Darstellung (3 Stufen)** in den Einstellungen, damit auch viele Sendungen passen:
  | Stufe | Zeigt |
  |-------|-------|
  | **Komfortabel** | volle Karte: Status, letzter Scan, ETA, Anbieter-Link |
  | **Kompakt** | Status + letzter Scan + Link (ohne ETA/Unterzeile) |
  | **Minimal** | eine dichte Zeile: Symbol + Name + Status |
- Weitere Optionen: Titel anzeigen, **Zugestellte ausblenden**, **Aktualisieren (Min.)** (Standard 30).

### Status-Farben

`Zugestellt` (grün) · `Unterwegs` (Akzent) · `Aktion nötig` (orange) · `Unbekannt`/keine Daten (grau).

### API

| Aufruf | Beschreibung |
|--------|----------------|
| `GET /api/plugins/parcel/track?carrier=dhl&number=…` | Verfolgt eine Sendung (`carrier`: `auto`\|`dhl`\|`hermes`\|`dpd`) |

Antwort (normalisiert): `{ carrier, number, found, state, status, progress?, eta?, lastEvent?, events[] }` mit `state` = `delivered`\|`transit`\|`problem`\|`unknown`.

### Hinweise

- **Caching:** Treffer werden serverseitig 10 Min. gecached, unbekannte Nummern kurz (3 Min.). Das Widget pollt bewusst langsam (Standard 30 Min.), um die Carrier nicht zu belasten.
- **Unofficial:** Die Endpunkte sind reverse-engineered und können sich ändern; die Parser sind defensiv. Ein Feld-Rename ist eine Ein-Stellen-Korrektur pro Carrier.
- **Outbound:** Der Server braucht ausgehenden HTTPS-Zugriff auf `dhl.de`, `my-deliveries.de`, `dpd.de`. SSRF-Guard ist aktiv (`_shared/ssrf.ts`).

### Deploy

1. `npm run build:plugin-pack -- parcel` — erzeugt `widget.js` + `server.mjs`.
2. `npm run generate:plugins-index` — trägt das Plugin in `plugins-index.json` ein.
3. `plugins-pack/` pushen → Plugin-Store → **Aktualisieren** → **Strg+F5**.

---

## English

Free multi-carrier parcel tracking **without an API key** — it queries the login-free public endpoints the carriers use on their own tracking pages.

### Supported carriers

| Carrier | Status | Endpoint (login-free) |
|---------|--------|------------------------|
| **DHL** | ✅ stable | `www.dhl.de/int-verfolgen/data/search` |
| **Hermes** | ✅ stable | `api.my-deliveries.de/tnt/parcelservice/parceldetails` |
| **DPD** | ⚠️ best-effort | `tracking.dpd.de/rest/plc/de_DE` — Akamai bot protection may block lookups |
| **GLS** | ❌ not possible | GLS retired its free endpoint in 2024/25 (login/API key required) |

**Auto** tries DHL → Hermes → DPD and takes the first hit.

### Usage

- **Add right in the widget:** type a tracking number at the bottom, pick a carrier (or *Auto*), press **+** / Enter.
- **Remove:** trash icon on each shipment.
- **View on carrier ↗:** opens the carrier's official tracking page with the number prefilled — full history there.
- **Display density (3 levels)** in settings so many shipments still fit: **Comfortable** (full card), **Compact** (status + last scan + link), **Minimal** (one dense line).
- More options: show title, **hide delivered**, **refresh (minutes)** (default 30).

### API

`GET /api/plugins/parcel/track?carrier=<auto|dhl|hermes|dpd>&number=…` → normalized
`{ carrier, number, found, state, status, progress?, eta?, lastEvent?, events[] }`, `state` = `delivered`\|`transit`\|`problem`\|`unknown`.

### Notes

- **Caching:** hits cache 10 min server-side, unknown numbers 3 min; the widget polls slowly (default 30 min) to be gentle on the carriers.
- **Unofficial:** endpoints are reverse-engineered and may change; parsers are defensive — a field rename is a one-spot fix per carrier.
- **Outbound:** the server needs HTTPS access to `dhl.de`, `my-deliveries.de`, `dpd.de`. SSRF guard is active.

### Deploy

1. `npm run build:plugin-pack -- parcel` → `widget.js` + `server.mjs`
2. `npm run generate:plugins-index`
3. Push `plugins-pack/` → Plugin Store → **Update** → **Ctrl+F5**.
