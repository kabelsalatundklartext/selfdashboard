# Central error log (Protokoll)

[🇬🇧 English](#english) | [🇩🇪 Deutsch](#deutsch)

SelfDashboard stores errors in a **single server-side log** (`data/error-log.jsonl`). Users open **Settings → Protokoll** to read, filter, export, or clear entries.

---

## Deutsch

### Was wird automatisch geloggt?

| Quelle | Wann | Plugin-ID |
|--------|------|-----------|
| **Jedes registrierte Plugin** | React-Renderfehler in der Kachel | `meta.id` |
| **Alle Widgets** | Fehlgeschlagene `fetch` zu `/api/…` (4xx/5xx, Netzwerk) | aus URL abgeleitet |
| **App** | Unbehandelte JS-Fehler / Promise-Rejections | — |
| **API-Routen** | Serverfehler, wenn `logPluginApiFailure` / `withApiRouteLog` genutzt wird | Route / Plugin |

`/api/logs` wird **nicht** mitgeloggt (keine Endlosschleife).

### Für Plugin-Autoren (Pflicht nur bei Sonderfällen)

Nach `registerPlugin(meta, component)` ist das **Widget automatisch** durch eine Error Boundary geschützt — **kein Extra-Code** nötig.

**Empfohlen bei eigenem API-Proxy:**

1. Route unter `src/app/api/<dein-plugin>/route.ts`
2. Im Widget: `fetch('/api/<dein-plugin>/…')` oder `pluginApiJson` aus `@/lib/pluginDev`
3. Server: Fehler mit `logPluginApiFailure` aus `@/lib/pluginLogServer` (nur in API-Routen!)

**Manuell loggen** (z. B. erwarteter Fehler, den du erklären willst):

```ts
import { reportPluginCatch } from '@/lib/pluginDev'

try {
  await doSomething()
} catch (e) {
  reportPluginCatch('meinplugin', e, 'sync')
}
```

**Nicht importieren** in Plugin-Dateien: `@/lib/pluginLogServer`, `@/lib/errorLog` (Server-only, bricht den Build).

### Aufbewahrung

3 / 7 / 30 Tage — einstellbar im Protokoll-Tab. Passwörter werden aus Details entfernt (`sanitizeLogText`).

---

## English

### What is logged automatically?

| Source | When | Plugin ID |
|--------|------|-----------|
| **Every registered plugin** | React render errors in the tile | `meta.id` |
| **All widgets** | Failed `fetch` to `/api/…` (4xx/5xx, network) | inferred from URL |
| **App** | Unhandled JS errors / promise rejections | — |
| **API routes** | Server errors when using `logPluginApiFailure` / `withApiRouteLog` | route / plugin |

`/api/logs` is **excluded** (no feedback loop).

### For plugin authors (extra code only for special cases)

After `registerPlugin(meta, component)` the **Widget is wrapped** with an error boundary — **no extra setup**.

**When you add a server proxy:**

1. Add `src/app/api/your-plugin/route.ts`
2. In the widget: `fetch('/api/your-plugin/…')` or `pluginApiJson` from `@/lib/pluginDev`
3. On the server: `logPluginApiFailure` from `@/lib/pluginLogServer` (API routes only)

**Manual logging:**

```ts
import { reportPluginCatch } from '@/lib/pluginDev'

try {
  await doSomething()
} catch (e) {
  reportPluginCatch('myplugin', e, 'sync')
}
```

**Do not import** in plugin files: `@/lib/pluginLogServer`, `@/lib/errorLog` (server-only).

### Retention

3 / 7 / 30 days — configurable in the Logs tab. Passwords are redacted from details.

---

## File reference

| File | Role |
|------|------|
| `src/lib/reportLog.ts` | Browser → `POST /api/logs` |
| `src/lib/pluginLog.ts` | `reportPluginCatch` / `reportPluginError` (client) |
| `src/lib/pluginLogServer.ts` | `logPluginApiFailure` (server API routes) |
| `src/lib/clientFetchLog.ts` | Global `fetch` hook |
| `src/lib/pluginDev.ts` | Public API for plugin authors |
| `src/lib/apiRouteLog.ts` | `withApiRouteLog` wrapper for routes |
| `src/lib/errorLog.ts` | Append / list / export JSONL |
| `src/components/layout/LogCapture.tsx` | Installs global hooks at app start |
| `src/lib/pluginRegistry.tsx` | Wraps every registered `Widget` |
