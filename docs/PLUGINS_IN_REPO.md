# Plugin-Quellen im Git-Repo (für Docker / CI)

Das App-Image braucht **`selfdashboard/plugins/`** mit allen `server.ts`-Dateien (nicht nur `plugins-pack/`).

Auf dem Entwickler-PC liegen die Quellen oft im **Geschwisterordner** `../plugins` — der ist im GitHub-Repo `kabelsalatundklartext/selfdashboard` **nicht** enthalten, deshalb schlägt Docker/CI fehl, wenn `plugins/` fehlt.

## Einmalig: `plugins/` ins Repo legen

PowerShell (Monorepo auf dem PC):

```powershell
cd C:\Users\svens\Desktop\SelfDashboard\selfdashboard
robocopy ..\plugins .\plugins /E /XD node_modules .git custom _template
git add plugins
git commit -m "Add plugin sources for builtin server handlers (Docker/CI build)"
git push origin beta
```

Danach findet GitHub Actions `plugins/weather/server.ts` und der Docker-Build läuft.

## Lokaler Docker-Build

```powershell
cd selfdashboard
node scripts/sync-plugins-for-build.mjs
docker build -t selfdashboard:beta .
```

## CI

Workflow `.github/workflows/docker-publish.yml` führt vor dem Image-Build aus:

`sh scripts/ci-prepare-plugins.sh`

Das Skript nutzt (in dieser Reihenfolge):

1. vorhandenes `./plugins/`
2. sonst `../plugins` (Monorepo)
3. sonst `git archive` von `plugins/` auf dem gleichen Branch

Ohne Schritt 3 muss `plugins/` im Repo committed sein.
