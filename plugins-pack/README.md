# plugins-pack (GitHub Plugin-Verteilung)

**Kein ZIP nötig.** Der Store installiert Dateien einzeln von GitHub:

```text
plugins-pack/
  plugins-index.json    ← Katalog (Store-Liste)
  clock/
    plugin.json
    widget.js
  docker/
    plugin.json
    widget.js
  …
```

Raw-URL-Beispiel:

```text
https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/beta/plugins-pack/clock/widget.js
```

## Maintainer: Pack aktualisieren

```bash
npm run publish:plugin-pack
git add plugins-pack/
git commit -m "Update plugins-pack for GitHub install"
git push origin beta
```

Nach dem Push: im Container Plugin-Store ↻ oder Seite Strg+F5.

Der Ordner `plugin-pack/` (Singular) mit `default-plugins.zip` ist nur ein Docker-Build-Artefakt — **nicht** für den GitHub-Store.
