# Plugin: Iframe (`iframe`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Betten eine **beliebige Webseite** per URL ins Dashboard ein — oder öffnen sie als **Link**, wenn der Zielserver **X-Frame-Options** / **CSP** das Einbetten verbietet (typisch bei Admin-Oberflächen, Banken, manchen Cloud-UIs).

### Installation

Plugin-Store → **Iframe** installieren → **Strg+F5** → URL in **⚙️** setzen.

### Modi

| Modus | Wann nutzen |
|-------|-------------|
| **Iframe** | Zielseite erlaubt Einbettung (`X-Frame-Options` nicht `DENY`/`SAMEORIGIN` von fremder Origin) |
| **Nur Link** | Seite blockiert Frames — Button öffnet URL in neuem Tab |
| **Viewport** | Optional getrennte Mobile/Desktop-URLs oder Skalierung (je nach Einstellungsversion) |

### Typische Anwendungen

- Interne Tools (Grafana, Portainer-UI, Homarr, …) — wenn Embedding erlaubt ist  
- Status-Seiten im LAN (`http://192.168.x.x/...`)  
- Karten oder einfache HTML-Dashboards

### Grenzen & Sicherheit

| Thema | Details |
|-------|---------|
| **X-Frame-Options / CSP** | Viele Dienste verbieten iframes von anderen Origins — dann **Link-Modus** oder Reverse-Proxy auf **dieselbe Origin** wie SelfDashboard |
| **Login in iframe** | Cookies/SSO funktionieren nicht immer im iframe — oft besser Link-Modus |
| **HTTPS-Mixed-Content** | HTTPS-Dashboard + HTTP-iframe kann der Browser blockieren |
| **Skripte** | SelfDashboard sandboxed das iframe soweit möglich — komplexe SPAs können trotzdem zicken |

### Einrichtung

1. URL in **⚙️** eintragen (mit `https://` oder `http://`)  
2. Modus **Iframe** testen — bei leerem Rahmen auf **Link** wechseln  
3. Widget groß genug ziehen (Bearbeitungsmodus)

### Speicher

Nur URL und Optionen in **`dashboard.json`** — kein Proxy durch SelfDashboard (Browser lädt die Seite direkt).
