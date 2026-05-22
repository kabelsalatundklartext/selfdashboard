# Docker-Image bauen

Builtin-Plugin-Server liegen in **`src/builtin-plugins/<id>/server.ts`** (vendored, im Git-Repo committed).

## Lokal

```bash
cd selfdashboard
# Optional refresh from ../plugins:
node scripts/vendor-builtin-plugins.mjs --force
docker build -t selfdashboard:beta .
```

`npm run build` inside the image runs `prebuild`; it **no-ops** when `src/builtin-plugins/` already exists.

## Dev-Monorepo (Quellen in `../plugins`)

```text
SelfDashboard/
├── selfdashboard/
└── plugins/          ← edit server code here
```

Nach Änderungen an `server.ts` / `lib/`:

```bash
npm run vendor-plugins -- --force
git add src/builtin-plugins
```

## CI / GitHub Actions

- Checkout enthält **`src/builtin-plugins/`** (muss committed sein).
- `sh scripts/ci-prepare-plugins.sh` prüft `src/builtin-plugins/weather/server.ts`.
- Siehe **[PLUGINS_IN_REPO.md](./PLUGINS_IN_REPO.md)**.

## `.dockerignore`

`scripts/vendor-builtin-plugins.mjs`, `scripts/ci-prepare-plugins.sh` und `src/builtin-plugins/` müssen im Build-Kontext sein.
