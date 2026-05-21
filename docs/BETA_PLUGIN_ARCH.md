# Beta: Plugin-Architektur (SelfDashboard)

Dieser Umbau läuft auf dem Git-Branch **`beta`** im bestehenden Repo — kein separates „Beta-Ordner“-Projekt.

## Docker-Image (automatisch)

Bei jedem **Push auf `beta`** baut GitHub Actions das Image und pusht es nach GHCR:

```text
ghcr.io/kabelsalatundklartext/selfdashboard:beta
```

- **`main`** → weiterhin `:latest` (stabile Nutzer / Unraid-Template)
- **`beta`** → nur `:beta` (Plugin-Umbau testen)
- Workflow: `.github/workflows/docker-publish.yml` (Tab **Actions** auf GitHub)

**Unraid / Docker:** Repository-Tag von `:latest` auf `:beta` stellen, Container neu erstellen oder mit Watchtower aktualisieren.

## Plugins nur im gemounteten Ordner (ohne Image-Rebuild)

Siehe **[CUSTOM_PLUGINS_VOLUME.md](./CUSTOM_PLUGINS_VOLUME.md)**.

- Host → `/app/plugins/custom` (z. B. `/mnt/user/Docker/selfdashboard/plugins`)
- Store: **Plugin-Ordner befüllen** kopiert `plugin.json`-Vorlagen aus dem Image
- **`widget.js`** / **`server.js`** auf dem Volume überschreiben UI bzw. API — TSX läuft nicht direkt vom Share

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
