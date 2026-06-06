# Plugin-Verteilung (Core-Image + GitHub + lokaler Ordner)

## Konzept

| Teil | Wo |
|------|-----|
| **SelfDashboard** | Docker-Image `ghcr.io/.../selfdashboard:latest` — nur App-Kern |
| **Plugins** | GitHub-Ordner `plugins-pack/` im Repo — **nicht** ins Image gebündelt (optional ZIP nur für Erststart) |
| **Installiert** | Unraid/Docker-Mount → `/app/plugins/custom` |

## Ablauf für Nutzer

1. SelfDashboard installieren (Image + Mount für `/app/plugins/custom`).
2. Plugin-Store öffnen → Abschnitt **„Von GitHub“** → **Installieren**.
3. Dateien werden von GitHub geladen und in den **gemounteten Ordner** geschrieben.
4. Seite lädt neu → Widget im Store unter **„Lokal / auf Dashboard“** → **Hinzufügen**.

## Lokale Plugins (ohne GitHub)

- Ordner anlegen: `plugins/<id>/plugin.json` + `widget.js` (+ optional `server.js`).
- **↻** im Store oder Container-Neustart → erkannt.
- Ordner **löschen** → nach Reload/Strg+F5 nicht mehr installiert (Volume-Scan); bei `hybrid` können Built-ins im Image weiter im Store erscheinen.

## GitHub-Konfiguration (Container-Env)

```text
SELFDASHBOARD_PLUGINS_GITHUB_REPO=kabelsalatundklartext/selfdashboard
SELFDASHBOARD_PLUGINS_GITHUB_REF=main
SELFDASHBOARD_PLUGINS_GITHUB_PATH=plugins-pack
```

Index-Datei: `plugins-pack/plugins-index.json` (Liste aller Plugins + Dateien).

Raw-URL-Beispiel:

```text
https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/main/plugins-pack/clock/widget.js
```

## Maintainer: Pack auf GitHub aktualisieren

```bash
npm run build:plugin-pack      # erzeugt widget.js pro Plugin
npm run generate:plugins-index   # plugins-index.json
git add plugins-pack/
git commit -m "Update plugin pack"
git push
```

**Wichtig:** `widget.js` muss im Repo liegen — `index.tsx` allein reicht nicht für Installation.

## API

| Endpoint | Zweck |
|----------|--------|
| `GET /api/plugins/remote-catalog` | Liste von GitHub + installiert? |
| `POST /api/plugins/install-remote` | `{ "pluginId": "clock" }` → Download ins Volume |
| `POST /api/plugins/reload` | Volume + Server neu scannen |
| `POST /api/plugins/upload-zip` | ZIP ins Volume |

## Netzwerk

Der Container braucht **HTTPS-Zugriff auf GitHub** (`raw.githubusercontent.com`) für Remote-Install.
