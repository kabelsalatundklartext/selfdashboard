# Plugins — Überblick (SelfDashboard)

Kurzreferenz für **Nutzer** und **Entwickler**. Ausführliche Anleitung zum Schreiben von Plugins: **[PLUGIN_DEV.md](./PLUGIN_DEV.md)**.

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
| `server.js` | Nein | Nur wenn das Plugin eine eigene Server-API braucht |

Nach Install: **Strg+F5** (Hard-Reload), damit `widget.js` geladen wird.

**Mail & Kalender:** E-Mail ist ein Plugin (`mail`) — nach Installation erscheinen Navbar-Badge und Tab **E-Mail** in den Einstellungen. Kalender-Daten liegen weiter unter `/app/data/calendar/`.

---

## Ordner auf dem PC (Entwicklung)

Empfohlene Struktur (wie bei dir):

```text
SelfDashboard/
├── plugins/              ← Quellcode (TypeScript/React), nur lokal
├── plugin-pack/          ← Build-Ausgabe ZIP (optional, nicht auf GitHub)
└── selfdashboard/        ← Git-Repo (App)
    └── plugins-pack/     ← Store auf GitHub (plugin.json + widget.js pro Plugin)
        └── plugins-index.json   ← Katalogliste für den Store
```

| Ordner | Auf GitHub? | Auf dem Server? |
|--------|-------------|-----------------|
| `plugins/` | Nein | Nein |
| `plugins-pack/` | **Ja** | Nein (wird beim Install kopiert) |
| `plugin-pack/` | Nein | Nein |

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
