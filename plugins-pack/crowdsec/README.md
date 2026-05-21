# Plugin: CrowdSec (`crowdsec`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Optional: **Alerts/Bans** aus lokaler **`crowdsec.db`**, Zeitraumfilter, GeoIP-Flags, optionales Entsperren via `cscli`.

**CrowdSec ist nicht Pflicht** für SelfDashboard.

### Installation

Plugin installieren → optional Mount **`/crowdsec-data`** → Widget **⚙️**.

### Daten

| Thema | Details |
|-------|---------|
| **DB** | `crowdsec.db` read-only |
| **Mount** | Host → `/crowdsec-data` |
| **Zeitraum** | 1 / 7 / 30 / 90 Tage, **1 / 2 / 5 / 10 Jahre**, **Alle** (gesamte DB) |
| **Max. Alerts** | 500 … 10.000 oder **Alle** (kein SQL-LIMIT) |
| **GeoIP** | `GeoLite2-*.mmdb` im Mount oder `CROWDSEC_GEOIP_PATH` |

### Entsperren (optional)

Docker-Socket + Container-Name (`CROWDSEC_CONTAINER`, Standard `crowdsec`).

### Env

`CROWDSEC_DATA_DIR`, `CROWDSEC_GEOIP_PATH`, `CROWDSEC_DB_PATH`, `CROWDSEC_CONTAINER`

```bash
-v /mnt/user/appdata/crowdsec/data:/crowdsec-data:ro
```

### API

`/api/crowdsec`, `/api/crowdsec/decision`

---

## English

### Summary

Optional: **alerts/bans** from local **`crowdsec.db`**, time range filter, GeoIP flags, optional unban via `cscli`.

**CrowdSec is not required** to run SelfDashboard.

### Installation

Install plugin → optional mount **`/crowdsec-data`** → widget **⚙️**.

### Data

| Topic | Details |
|-------|---------|
| **DB** | `crowdsec.db` read-only |
| **Mount** | Host → `/crowdsec-data` |
| **Range** | 1 / 7 / 30 / 90 days, **1 / 2 / 5 / 10 years**, **All** (entire DB) |
| **Max alerts** | 500 … 10,000 or **All** (no SQL LIMIT) |
| **GeoIP** | `GeoLite2-*.mmdb` in mount or `CROWDSEC_GEOIP_PATH` |

### Unban (optional)

Docker socket + container name (`CROWDSEC_CONTAINER`, default `crowdsec`).

### Env

`CROWDSEC_DATA_DIR`, `CROWDSEC_GEOIP_PATH`, `CROWDSEC_DB_PATH`, `CROWDSEC_CONTAINER`

```bash
-v /mnt/user/appdata/crowdsec/data:/crowdsec-data:ro
```

### API

`/api/crowdsec`, `/api/crowdsec/decision`
