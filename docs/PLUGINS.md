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

**API (`/api/plugins/<id>/…`):** läuft aus dem **Docker-Image** (`src/builtin-plugins/<id>/server.ts`).  
`plugins-pack/` liefert nur **UI** (`plugin.json` + `widget.js`) — API-Änderungen brauchen ein neues Image.

Nach Install: **Strg+F5** (Hard-Reload), damit `widget.js` geladen wird.

### Updates von GitHub

1. Maintainer erhöht `version` in `plugins-pack/<id>/plugin.json`, passt `widget.js` an und pusht `plugins-pack/` (danach `npm run generate:plugins-index` für `plugins-index.json`).
2. SelfDashboard lädt `plugins-index.json` vom konfigurierten Branch (Cache ~5 Min.).
3. Installierte Plugins: Vergleich **Version auf Platte** (`/app/plugins/custom/<id>/plugin.json`) mit **Version im Index**.
4. Bei neuerer Version: **Hinweis-Leiste** unter der Navbar + orangener Punkt am **+** (Bearbeitungsmodus).
5. **Aktualisieren** im Store oder **Alle aktualisieren** in der Leiste — lädt dieselben Dateien wie die Erstinstallation (überschreibt `plugin.json` + `widget.js`). Danach **Strg+F5**.

ZIP-Plugins ohne GitHub-Eintrag werden nicht automatisch verglichen.

**Mail & Kalender:** E-Mail ist ein Plugin (`mail`) — nach Installation erscheinen Navbar-Badge und Tab **E-Mail** in den Einstellungen. Kalender-Daten liegen weiter unter `/app/data/calendar/`.

---

## Ordner im Repo (GitHub)

```text
selfdashboard/
├── plugins-pack/              ← Plugin-Store (GitHub) — hier ändern & pushen
│   ├── weather/
│   │   ├── plugin.json
│   │   └── widget.js
│   └── plugins-index.json
└── src/builtin-plugins/       ← Server-API fürs Docker-Image (bei API-Änderungen)
```

| Ordner | Auf GitHub? | Auf dem Tower (Volume)? |
|--------|-------------|-------------------------|
| `plugins-pack/` | **Ja** — einziger Plugin-Store im Repo | Nein — wird nach `/app/plugins/custom/` installiert |
| `src/builtin-plugins/` | **Ja** — API im Docker-Image | Nein |
| `plugins/` | **Nein** (lokal optional, `.gitignore`) | Nein |
| `plugin-pack/` | **Nein** (lokal optional, `.gitignore`) | Nein |
| `/app/plugins/custom/<id>/` | Nein | **Ja** — `plugin.json` + `widget.js` |

**Workflow Plugin-UI:** `plugins-pack/<id>/plugin.json` (Version) + `widget.js` anpassen → `npm run generate:plugins-index` → `plugins-pack/` pushen.

**Workflow Plugin-API:** `src/builtin-plugins/<id>/server.ts` anpassen → neues Docker-Image bauen/pushen.

Optional lokal (nicht auf GitHub): Ordner `plugins/` mit `index.tsx` für `npm run build:plugin-pack`, oder `plugin-pack/` als ZIP-Staging.

---

## `plugins-index.json` — was ist das?

Die **Inhaltsliste des GitHub-Stores**. Enthält pro Plugin: ID, Name, Version, welche Dateien installiert werden.

- **Wird nicht** beim Klick im UI geschrieben
- **Wird erzeugt** mit: `npm run generate:plugins-index` (nach Änderungen unter `plugins-pack/`)
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
| `SELFDASHBOARD_PLUGINS_GITHUB_REF` | Branch, Stable: `main` |
| `SELFDASHBOARD_PLUGINS_GITHUB_PATH` | `plugins-pack` |

---

## Plugin-Katalog (alle Plugins)

**[README — Plugins](../README.md#plugins)** — Katalogtabelle · **`docs/plugins/<id>/README.md`** (DE/EN pro Plugin).

## Git: Commits & Namen auf GitHub

**Auf GitHub pushen:** nur **`plugins-pack/`** (und App-Code). Ordner `plugins/` und `plugin-pack/` bleiben lokal (siehe `.gitignore`).

**Wer als Autor erscheint:**

| So committen | Ergebnis auf GitHub |
|--------------|---------------------|
| **GitHub Desktop** (oder dein Git mit deinem Account) | Nur **dein** Benutzername |
| Commit/Push aus dem **Cursor-Chat** | Oft `Co-authored-by: Cursor` → zweiter Eintrag **cursoragent** |

**Empfehlung:** Dateien im Editor/Cursor ändern lassen, **Commit + Push selbst** in GitHub Desktop. Kein „push“ im Agent-Chat.

Alte Commits mit `Co-authored-by: Cursor` bleiben in der History, bis du sie gezielt bereinigst (optional). Neue Commits nur über Desktop → keine neuen **cursoragent**-Einträge.

---

## Weitere Doku

- **[PLUGIN_DEV.md](./PLUGIN_DEV.md)** — Plugin schreiben (Widget, API, Store, ZIP)
- **[LOGGING.md](./LOGGING.md)** — Fehlerprotokoll
- **[CHANGELOG.md](./CHANGELOG.md)** — Änderungen
