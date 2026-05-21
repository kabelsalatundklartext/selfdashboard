# Plugin: CrowdSec (`crowdsec`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

**SelfDashboard braucht CrowdSec nicht.** Das Plugin ist optional für Nutzer mit lokaler `crowdsec.db`.

| Thema | Details |
|-------|---------|
| **Daten** | SQLite `crowdsec.db` read-only |
| **Mount** | Host-Ordner → `/crowdsec-data` (Unraid: **CrowdSec Data optional**) |
| **Entsperren** | Optional per `docker exec` + `cscli` — braucht **Docker Socket** |
| **GeoIP** | `GeoLite2-*.mmdb` im Mount oder `CROWDSEC_GEOIP_PATH` |
| **Zeitraum** | 1 / 7 / 30 / 90 / 365 Tage im Widget |

### Env (optional)

`CROWDSEC_DATA_DIR`, `CROWDSEC_GEOIP_PATH`, `CROWDSEC_DB_PATH`, `CROWDSEC_CONTAINER`

### Beispiel-Mount

```bash
-v /mnt/user/appdata/crowdsec/data:/crowdsec-data:ro
```

Nach Install: Widget im Store hinzufügen, DB-Pfad prüfen.

---

## English

Optional widget reading local `crowdsec.db` from `/crowdsec-data`. No CrowdSec required to run SelfDashboard. Optional unban via Docker socket + `cscli`.
