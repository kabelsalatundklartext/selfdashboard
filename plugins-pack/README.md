# plugins-pack (GitHub store artifacts)

This folder is the **remote plugin store** on GitHub — not user documentation.

| File / folder | Purpose |
|---------------|---------|
| `plugins-index.json` | Catalog for **Plugin Store → From GitHub** |
| `<plugin-id>/plugin.json` | Metadata |
| `<plugin-id>/widget.js` | Bundled widget (required) |
| `<plugin-id>/README.md` | Optional copy of user docs (see `docs/plugins/<id>/`) |

**User-facing plugin list and setup guides:** main [README — Plugins](../README.md#plugins) and per-plugin [docs/plugins/](../docs/plugins/README.md).

## Maintainer: update the pack

```bash
npm run publish:plugin-pack
git add plugins-pack/
git commit -m "Update plugins-pack for GitHub install"
git push origin beta
```

After push: **Plugin Store** ↻ or hard-reload (Ctrl+F5).

`plugin-pack/` (singular) with `default-plugins.zip` is a local build artifact only — **not** used by the GitHub store.
