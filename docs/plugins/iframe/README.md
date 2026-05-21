# Plugin: Iframe (`iframe`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Webseite per URL** einbetten oder als **Link** öffnen, wenn **X-Frame-Options** / **CSP** Embedding blockieren.

### Installation

Plugin-Store → **Iframe** → **Strg+F5** → URL in **⚙️**.

### Modi

| Modus | Wann |
|-------|------|
| **Iframe** | Ziel erlaubt Embedding |
| **Nur Link** | Frame blockiert — öffnet neuen Tab |
| **Viewport** | Optional Mobile/Desktop (je nach Version) |

### Grenzen

- Viele Admin-UIs verbieten iframes → **Link-Modus** oder Reverse-Proxy auf gleiche Origin  
- Login/SSO im iframe oft problematisch  
- HTTPS-Dashboard + HTTP-Ziel = Mixed-Content-Warnung

### Speicher

Nur in **`dashboard.json`** — Browser lädt die Seite direkt.

---

## English

### Summary

Embed any **URL in an iframe** or open as a **link** when **X-Frame-Options** / **CSP** block embedding.

### Installation

Plugin Store → **Iframe** → **Ctrl+F5** → set URL in **⚙️**.

### Modes

| Mode | When |
|------|------|
| **Iframe** | Target allows embedding |
| **Link only** | Frame blocked — opens new tab |
| **Viewport** | Optional mobile/desktop (version-dependent) |

### Limitations

- Many admin UIs block iframes → **link mode** or reverse proxy on same origin  
- Login/SSO inside iframe often fails  
- HTTPS dashboard + HTTP target may cause mixed-content blocking

### Storage

Only in **`dashboard.json`** — browser loads the page directly.
