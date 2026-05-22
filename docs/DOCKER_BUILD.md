# Docker-Image bauen

Builtin-Plugin-Server liegen in **`plugins/<id>/server.ts`**. Beim Image-Build muss der Ordner **`plugins/`** im Docker-Kontext existieren (unter `selfdashboard/plugins/`).

## Option A — Monorepo lokal (empfohlen)

Layout:

```text
SelfDashboard/
├── selfdashboard/    ← Git-Repo / docker build cwd
└── plugins/          ← Quellen
```

Vor dem Build:

```bash
cd selfdashboard
node scripts/sync-plugins-for-build.mjs
docker build -t selfdashboard:beta .
```

`sync-plugins-for-build.mjs` kopiert `../plugins` → `./plugins`. Danach findet webpack die Handler.

## Option B — Monorepo, Docker vom Parent

```bash
cd SelfDashboard
docker build -f selfdashboard/Dockerfile .
```

Dafür muss das Dockerfile `COPY selfdashboard/` + `COPY plugins/` nutzen (angepasste Variante) — Standard-Dockerfile im Repo nutzt **Option A** (`COPY . .` im Repo-Root).

## GitHub Actions (Repo = nur selfdashboard)

Der Workflow braucht **`plugins/` im Build-Kontext**. Beispiel:

```yaml
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          path: selfdashboard
      - uses: actions/checkout@v4
        with:
          repository: kabelsalatundklartext/selfdashboard
          ref: beta
          path: plugins
          sparse-checkout: |
            plugins
      # Falls plugins ein eigener Ordner im selben Repo ist, stattdessen nur ein Checkout.

      - name: Prepare plugins for image build
        working-directory: selfdashboard
        run: |
          rm -rf plugins
          cp -a ../plugins ./plugins
          test -f plugins/weather/server.ts

      - name: Build image
        working-directory: selfdashboard
        run: docker build -t selfdashboard:beta .
```

Wenn `plugins/` **dauerhaft im selfdashboard-Repo** liegt (Subtree/Submodule), entfällt der Copy-Schritt.

## Technik

- `next.config.js`: Webpack-Alias `@plugins` → `./plugins` oder `../plugins`
- `src/lib/pluginServers/*.ts`: `export … from '@plugins/<id>/server'`
- `npm run build` → `prebuild` ruft Sync auf, falls `./plugins` noch fehlt

## Fehler „Build failed … pluginServerLoader“

Ursache: **`plugins/weather/server.ts` nicht gefunden** im Build-Kontext.

Prüfen:

```bash
ls plugins/weather/server.ts
node scripts/sync-plugins-for-build.mjs
npm run build
```
