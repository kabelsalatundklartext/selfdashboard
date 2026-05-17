# 📅 SelfDashboard Calendar Plugin — PR Bundle

Vollständiges Calendar-Plugin für [SelfDashboard](https://github.com/kabelsalatundklartext/selfdashboard).

CalDAV-Two-Way-Sync (iCloud, Nextcloud, Fastmail, Posteo, mailbox.org …)
+ ICS-Read-Only-Feeds. Single-Container, kein Python, keine DB —
TypeScript + JSON-Datei in `/app/data/calendar/`.

## Was als nächstes tun

👉 **[docs/INSTALL.md](./docs/INSTALL.md)** — Schritt-für-Schritt:
Fork, Branch, Dateien einsortieren, Dependencies, Plugin
registrieren, Test, PR.

👉 **[docs/PR_BODY.md](./docs/PR_BODY.md)** — fertige PR-Beschreibung
zum Copy/Paste in GitHub.

👉 **[plugins/calendar/README.md](./plugins/calendar/README.md)** —
Plugin-eigene Doku: Features, Provider-Hinweise, V1-Limitations.

## Verzeichnisstruktur dieses Pakets

```
sd-calendar/
├── README.md                          (du bist hier)
├── docs/
│   ├── INSTALL.md                     Installation + PR-Workflow
│   └── PR_BODY.md                     PR-Beschreibung copy/paste
├── plugins/calendar/                  → kommt nach plugins/calendar/
│   ├── README.md
│   ├── api-client.ts
│   ├── i18n.ts
│   └── index.tsx
├── src/
│   ├── instrumentation.ts             → kommt nach src/instrumentation.ts
│   ├── lib/calendar/                  → kommt nach src/lib/calendar/
│   │   ├── api-helpers.ts
│   │   ├── caldav.ts
│   │   ├── crypto.ts
│   │   ├── ical.ts
│   │   ├── ics.ts
│   │   ├── store.ts
│   │   ├── sync.ts
│   │   └── types.ts
│   └── app/api/calendar/              → kommt nach src/app/api/calendar/
│       ├── accounts/
│       ├── calendars/
│       ├── conflicts/
│       ├── events/
│       ├── status/
│       └── summary/
```

## Quick Reference

| Was | Wo |
| --- | --- |
| Plugin-Eintrag im Store | `plugins/calendar/index.tsx` — exportiert `meta` + `component` |
| 2-Zeilen-Patch | `src/lib/pluginLoader.ts` (selbst editieren — siehe INSTALL.md) |
| Server-Logik (CalDAV/ICS) | `src/lib/calendar/` |
| HTTP-Endpunkte | `src/app/api/calendar/` — alle unter `/api/calendar/...` |
| Background-Scheduler | `src/instrumentation.ts` (5 Min Default, env-konfigurierbar) |
| Datenstorage | `/app/data/calendar/store.json` (passt zum SelfDashboard-Pattern) |
| Passwort-Verschlüsselung | AES-256-GCM, Key in `/app/data/calendar/.calendar-key` (chmod 600) |

## Dependencies die neu reinkommen

```json
"tsdav":   "^2.1.5",
"ical.js": "^2.1.0",
"rrule":   "^2.8.1"
```

Crypto = eingebautes `node:crypto`. Keine weiteren native-deps.

## Lizenz

Passend zum Haupt-Repo: **MIT**.
