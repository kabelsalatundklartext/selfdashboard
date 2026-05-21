# Beta: Plugin-Architektur (SelfDashboard)

Dieser Umbau läuft auf dem Git-Branch **`Beta`** im bestehenden Repo — kein separates „Beta-Ordner“-Projekt.

## Ziel

Alles zu einem Plugin gehört in **einen Ordner** unter `plugins/<id>/`:

| Datei | Zweck |
|--------|--------|
| `plugin.json` | Metadaten für Store & Scanner (Name, Version, Kategorie, …) |
| `index.tsx` | Widget (+ optional Settings), `'use client'` |
| `server.ts` | Server-API (optional), registriert am Gateway |
| `icon.png` / `iconUrl` in JSON | Logo |

**Mehrfach auf dem Dashboard:** `pluginId` (Typ) vs. `instanceId` (Kachel) — unverändert.

## API-Gateway

Statt vieler `src/app/api/<plugin>/route.ts`:

- **`POST/GET … /api/plugins/<pluginId>/…`** → Handler aus `plugins/<id>/server.ts`
- Legacy-Routen (z. B. `/api/adguard`) bleiben vorerst als dünne Proxies

Widgets rufen APIs über `pluginApiJson('adguard', '/', { method: 'POST', body })` auf → `/api/plugins/adguard/`.

## Scanner

Beim **Container-Start** (`instrumentation.ts`):

1. `plugins/*/plugin.json` (Builtin)
2. `plugins/custom/*/plugin.json` (Volume, z. B. Unraid → `/app/plugins/custom`)

Endpoints:

- `GET /api/plugins/catalog` — Katalog inkl. `widgetLoaded`
- `POST /api/plugins/reload` — Manifest-Cache neu (Store-Button ↻)

**Hinweis:** Neue **Builtin-Widgets** brauchen weiterhin Eintrag in `pluginLoader.ts` + Image-Rebuild. Custom-Manifeste werden sofort neu gelesen.

## Ordner (Docker / Unraid)

| Pfad im Image | Inhalt |
|---------------|--------|
| `/app/plugins/<id>/` | Builtin (im Image) |
| `/app/plugins/custom/<id>/` | Nutzer-Plugins (Volume) |

Env optional: `SELFDASHBOARD_PLUGINS_BUILTIN`, `SELFDASHBOARD_PLUGINS_CUSTOM`.

## Migrationsstand (Beta)

| Plugin | plugin.json | server.ts | Gateway |
|--------|-------------|-----------|---------|
| adguard | ✅ | ✅ | ✅ |
| clock | ✅ | — | — |
| übrige Builtin | offen | offen | offen |

Nächste Schritte: fritzbox, fritz-energy, crowdsec, docker, calendar nach gleichem Muster; `plugin.json` für alle Builtin-IDs.

## Entwickler

Siehe weiterhin `docs/PLUGIN_DEV.md`; Template: `plugins/_template/` inkl. `plugin.json`.
