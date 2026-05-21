# Plugin: Kalender (`calendar`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

| Thema | Details |
|-------|---------|
| **CalDAV** | Zwei-Wege-Sync (iCloud, Nextcloud, WEB.DE, …) |
| **ICS** | Nur lesen — Abo-URL |
| **Speicher** | `data/calendar/store.json` unter `/app/data` |
| **Verschlüsselung** | Zugangsdaten AES-256-GCM (`SELFDASHBOARD_CALENDAR_KEY`) |
| **UI** | Kachel + Vollbild; Konten im Modal (Zahnrad) |
| **Sync** | Hintergrund alle 5 Min (`CALENDAR_SYNC_INTERVAL_SECONDS`) |

Konten werden im Kalender-Modal konfiguriert, nicht mehr im alten Widget-JSON.

## English

CalDAV two-way + read-only ICS. Data in `data/calendar/` on the config volume. Account setup in the calendar modal (cog icon). Background sync every 5 minutes by default.
