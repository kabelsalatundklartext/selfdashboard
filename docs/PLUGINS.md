# Plugins — Überblick (SelfDashboard)

Kurzreferenz für **Nutzer** und **Entwickler**. Ausführliche Anleitung: **[PLUGIN_DEV.md](./PLUGIN_DEV.md)**. Plugin-Ordner & API (Beta): **[PLUGIN_ARCH_BETA.md](./PLUGIN_ARCH_BETA.md)**.

---

## Für Nutzer (Installation)

Plugins kommen **nicht** mit dem Dashboard mit. Du installierst sie über:

1. **Plugin-Store** → Tab „Von GitHub“ → **Installieren** (lädt `plugin.json` + `widget.js` vom Repo)
2. **ZIP hochladen** im Store (gleicher Inhalt wie ein Plugin-Ordner)

**Speicherort im Container:** `/app/plugins/custom/<plugin-id>/`

| Datei | Pflicht | Zweck |
|--------|---------|--------|
| `plugin.json` | Ja | Name, Version, Kategorie fürs UI |
| `widget.js` | Ja | Dashboard-Widget (fertig gebündelt) |

**API (`/api/plugins/<id>/…`):** läuft aus dem **Docker-Image** (Quellcode in `plugins/<id>/server.ts` → `src/builtin-plugins/`).  
Das Plugin-Pack liefert **kein** `server.mjs` mehr — nur UI-Updates ohne Image-Rebuild.

Nach Install: **Strg+F5** (Hard-Reload), damit `widget.js` geladen wird.

### Updates von GitHub

1. Maintainer erhöht `version` in `plugin.json` und pusht `plugins-pack/` (`npm run publish:plugin-pack`).
2. SelfDashboard lädt `plugins-index.json` vom konfigurierten Branch (Cache ~5 Min.).
3. Installierte Plugins: Vergleich **Version auf Platte** (`/app/plugins/custom/<id>/plugin.json`) mit **Version im Index**.
4. Bei neuerer Version: **Hinweis-Leiste** unter der Navbar + orangener Punkt am **+** (Bearbeitungsmodus).
5. **Aktualisieren** im Store oder **Alle aktualisieren** in der Leiste — lädt dieselben Dateien wie die Erstinstallation (überschreibt `plugin.json` + `widget.js`). Danach **Strg+F5**.

ZIP-Plugins ohne GitHub-Eintrag werden nicht automatisch verglichen.

**Mail & Kalender:** E-Mail ist ein Plugin (`mail`) — nach Installation erscheinen Navbar-Badge und Tab **E-Mail** in den Einstellungen. Kalender-Daten liegen weiter unter `/app/data/calendar/`.

---

## Ordner auf dem PC (Entwicklung)

```text
selfdashboard/                 ← Git-Repo (App)
├── plugins/                   ← Plugin-Quellen (UI + server.ts + lib/) — nach Sync im Repo
│   ├── calendar/
│   │   ├── index.tsx          → widget.js
│   │   ├── server.ts          → API (im Image als builtin-plugins)
│   │   └── lib/
│   └── docker/
│       ├── index.tsx
│       ├── server.ts
│       └── lib/
├── src/builtin-plugins/       ← Kopie der Server-Teile fürs Docker-Image (CI)
├── plugins-pack/              ← Store auf GitHub (nur plugin.json + widget.js)
│   └── plugins-index.json
└── plugin-pack/               ← ZIP-Build (optional, lokal)
```

| Ordner | Auf GitHub? | Auf dem Server (Volume)? |
|--------|-------------|---------------------------|
| `plugins/` | **Ja** (empfohlen, nach `node scripts/sync-plugins-for-build.mjs`) | Nein |
| `src/builtin-plugins/` | **Ja** (Server fürs Image) | Nein |
| `plugins-pack/` | **Ja** | Nein — wird beim Install nach `/app/plugins/custom/` kopiert |
| `/app/plugins/custom/<id>/` | Nein | **Ja** — nur `plugin.json` + `widget.js` |

**Wichtig:** Änderungen nur in `selfdashboard/plugins/<id>/` machen (sichtbar in GitHub Desktop), dann `npm run build:plugin-pack` und ggf. `npm run vendor-plugins -- --force` für API-Änderungen im Image.

---

## `plugins-index.json` — was ist das?

Die **Inhaltsliste des GitHub-Stores**. Enthält pro Plugin: ID, Name, Version, welche Dateien installiert werden.

- **Wird nicht** beim Klick im UI geschrieben
- **Wird erzeugt** mit: `npm run publish:plugin-pack` (im Repo `selfdashboard/`)
- Muss mit nach GitHub gepusht werden, damit neue Plugins im Store erscheinen

ZIP-Upload durch Nutzer braucht **keinen** Eintrag in dieser Datei.

---

## Docker / Unraid

| Mount | Inhalt |
|-------|--------|
| `/app/data` | `dashboard.json`, Kalender, Logs, … |
| `/app/plugins/custom` | Installierte Plugins |

Beispiel:

```bash
-v /mnt/user/appdata/selfdashboard:/app/data
-v /mnt/user/appdata/selfdashboard/plugins:/app/plugins/custom
```

Env (im Image `:beta` bereits gesetzt):

| Variable | Bedeutung |
|----------|-----------|
| `SELFDASHBOARD_PLUGINS_GITHUB_REPO` | z. B. `kabelsalatundklartext/selfdashboard` |
| `SELFDASHBOARD_PLUGINS_GITHUB_REF` | Branch, z. B. `beta` |
| `SELFDASHBOARD_PLUGINS_GITHUB_PATH` | `plugins-pack` |

---

## Plugin-Katalog (alle Plugins)

**[README — Plugins](../README.md#plugins)** — Katalogtabelle · **[plugins/README.md](./plugins/README.md)** — Index mit Link zu `docs/plugins/<id>/README.md` (DE/EN pro Plugin).

## Weitere Doku

- **[PLUGIN_DEV.md](./PLUGIN_DEV.md)** — Plugin schreiben (Widget, API, Store, ZIP)
- **[LOGGING.md](./LOGGING.md)** — Fehlerprotokoll
- **[CHANGELOG.md](./CHANGELOG.md)** — Änderungen
