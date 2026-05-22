# Builtin plugin servers for Docker / CI

The app image needs **server handlers** for builtin plugins (weather, calendar, docker, …).

Those are vendored into **`src/builtin-plugins/<id>/`** and **committed to git** so GitHub Actions and Docker builds work without a sibling `../plugins` folder.

Widget UI still comes from **`plugins-pack/`** (and dev sources in `../plugins` on your PC).

## One-time: refresh vendored tree from dev `../plugins`

PowerShell (monorepo on your PC):

```powershell
cd C:\Users\svens\Desktop\SelfDashboard\selfdashboard
node scripts/vendor-builtin-plugins.mjs --force
git add src/builtin-plugins
git commit -m "Vendor builtin plugin server sources for CI/Docker"
git push origin beta
```

After that, CI only needs `src/builtin-plugins/weather/server.ts` to exist in the checkout.

## Local dev

- Edit plugin server code in `../plugins/<id>/` (source of truth).
- Re-vendor when you change server handlers: `npm run vendor-plugins` or `node scripts/vendor-builtin-plugins.mjs --force`.
- `npm run prebuild` skips copying if `src/builtin-plugins/` is already present.

## CI / Docker

- Workflow runs `sh scripts/ci-prepare-plugins.sh` — passes if `src/builtin-plugins/` is committed.
- `Dockerfile` checks `src/builtin-plugins/weather/server.ts`.
- `npm run build` runs `prebuild` (vendor script no-ops when vendored tree exists).

## Optional: full `plugins/` in repo

You can still copy the whole `plugins/` tree into `selfdashboard/plugins/` for monorepo-less clones; the build prefers `src/builtin-plugins/` when present.
