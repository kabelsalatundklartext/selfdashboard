# Plugins getrennt vom Core (Volume + ZIP)

## Konzept (Beta)

| Teil | Wo |
|------|-----|
| **SelfDashboard Core** | Docker-Image `:beta` / `:latest` — Dashboard, Store, API-Gateway, kein Plugin-UI im Bundle (`SELFDASHBOARD_PLUGINS_MODE=volume`) |
| **Alle Plugins** | Host-Ordner → `/app/plugins/custom` — löschen = Plugin weg |
| **Standard-Pack** | Beim **ersten Start** entpackt das Image `default-plugins.zip` in den Ordner (wenn leer) |
| **ZIP** | Plugin-Store → **ZIP hochladen** oder Pack manuell entpacken |

## Unraid

- **Custom Plugins Path:** `/mnt/user/Docker/selfdashboard/plugins` → `/app/plugins/custom`
- **Config Storage:** weiterhin `/app/data` für `dashboard.json`

## Ordner pro Plugin

```text
plugins/
├── adguard/
│   ├── plugin.json
│   ├── widget.js
│   └── server.js      ← optional
├── crowdsec/
│   └── …
```

**Nicht brauchen?** Ordner `crowdsec/` auf dem Host **löschen** → nach **Strg+F5** weg aus dem Store (Widgets auf dem Dashboard ggf. manuell entfernen).

## Erster Start (leerer Ordner)

1. Container startet mit `SELFDASHBOARD_PLUGINS_MODE=volume`
2. Wenn kein `plugin.json` im Volume: entpacken von `/app/plugin-pack/default-plugins.zip`
3. Browser öffnen → Plugins sind da

Falls der Ordner leer bleibt: Actions-Build prüfen (Pack im Image) oder **ZIP hochladen** / separates Plugin-Pack von Releases.

## ZIP-Format

```text
meinplugin/
  plugin.json
  widget.js
  server.js   (optional)
```

Oder mehrere Plugins in einer ZIP (jeweils Unterordner mit `plugin.json`).

## Plugin-Store

| Button | Wirkung |
|--------|---------|
| **ZIP hochladen** | Plugins installieren/aktualisieren |
| **Plugin-Ordner befüllen** | Nur `plugin.json`-Vorlagen (ohne volles Pack) |
| **↻** | Manifeste + `server.js` neu laden |

Nach ZIP oder Löschen auf dem Host: **Strg+F5**.

## Modus

| Env | Bedeutung |
|-----|-----------|
| `SELFDASHBOARD_PLUGINS_MODE=volume` | **Standard im Image** — nur Volume-Plugins |
| `SELFDASHBOARD_PLUGINS_MODE=hybrid` | Wie früher: Builtin im Image + Volume-Overrides (Entwicklung) |

## Plugin-Pack bauen (Maintainer)

```bash
npm install
npm run build:plugin-pack
```

Erzeugt `plugin-pack/default-plugins.zip` (im Docker-Build automatisch).

## Später: separates Plugin-Pack-Image

Optional zweites Image nur mit ZIP-Inhalt — gleicher Mount. Für Nutzer reicht ein ZIP von GitHub Releases + Upload.
