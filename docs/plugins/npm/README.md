# Plugin: Nginx Proxy Manager (`npm`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt die **Proxy-Hosts** deines **Nginx Proxy Manager**: Anzahl, Online/Offline-Status und SSL. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Basis-URL** | z. B. `http://192.168.1.5:81` |
| **Benutzer / Passwort** | NPM-Login — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/npm` — Login holt Token, liest `/api/nginx/proxy-hosts`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 | Zugangsdaten prüfen |
| Leer | Proxy-Hosts angelegt? |

---

## English

### Summary

Shows the **proxy hosts** of your **Nginx Proxy Manager**: count, online/offline status and SSL. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Base URL** | e.g. `http://192.168.1.5:81` |
| **User / password** | NPM login — stored **encrypted** |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/npm` — login fetches a token, reads `/api/nginx/proxy-hosts`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Check credentials |
| Empty | Any proxy hosts configured? |
