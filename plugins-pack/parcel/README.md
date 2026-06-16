# Paketverfolgung-Plugin

Kostenlose Multi-Carrier-Sendungsverfolgung ohne API-Key. Server-Logik: `plugins-pack/parcel/server.ts`.

Fragt die **login-freien öffentlichen Endpunkte** ab, die die Carrier selbst für ihre Tracking-Seiten nutzen — kein Account, kein API-Key, keine Limits (Fair-Use beachten).

## Unterstützte Anbieter

| Anbieter | Status | Endpunkt (login-frei) |
|----------|--------|------------------------|
| **DHL** | ✅ stabil | `www.dhl.de/int-verfolgen/data/search` |
| **Hermes** | ✅ stabil | `api.my-deliveries.de/tnt/parcelservice/parceldetails` |
| **DPD** | ⚠️ experimentell | `tracking.dpd.de/rest/plc/de_DE` (Akamai-Bot-Schutz kann blockieren) |
| **GLS** | ❌ nicht möglich | GLS hat den freien Endpunkt 2024/25 abgeschaltet (Login/API-Key nötig) |

`Auto` probiert DHL → Hermes → DPD und nimmt den ersten Treffer.

## API

| Aufruf | Beschreibung |
|--------|----------------|
| `GET /api/plugins/parcel/track?carrier=dhl&number=…` | Verfolgt eine Sendung (carrier: `auto`\|`dhl`\|`hermes`\|`dpd`) |

Antwort (normalisiert):

```json
{
  "carrier": "dhl",
  "number": "00340000000000000000",
  "found": true,
  "state": "transit",
  "status": "Die Sendung wurde abgeholt",
  "progress": 0.4,
  "eta": null,
  "lastEvent": { "date": "2026-06-16T08:12:00", "text": "…", "location": "Hamburg" },
  "events": [ … ]
}
```

`state`: `delivered` \| `transit` \| `problem` \| `unknown`.

## Hinweise

- **Caching:** Treffer werden serverseitig 10 Min. gecached. Das Widget pollt standardmäßig alle 30 Min. — bewusst langsam, um die Carrier nicht zu belasten.
- **Unofficial:** Die Endpunkte sind reverse-engineered und können sich jederzeit ändern. Parser sind defensiv, ein Feld-Rename ist eine Ein-Stellen-Korrektur pro Carrier.
- **Hermes-History:** Die Event-Feldnamen von `api.my-deliveries.de` sind undokumentiert; der Parser sucht defensiv mehrere mögliche Schlüssel und fällt auf den aktuellen Status zurück.
- **Outbound:** Der Server braucht ausgehenden HTTPS-Zugriff auf `dhl.de`, `my-deliveries.de`, `dpd.de`. SSRF-Guard ist aktiv (`_shared/ssrf.ts`).

## Deploy

1. `npm run build:plugin-pack -- parcel` — erzeugt `widget.js` + `server.mjs`.
2. `npm run generate:plugins-index` — trägt das Plugin in `plugins-index.json` ein.
3. `plugins-pack/` pushen → Plugin-Store → **Aktualisieren**, dann Hard-Reload.

Architektur: [PLUGIN_ARCH_BETA.md](../../PLUGIN_ARCH_BETA.md).
