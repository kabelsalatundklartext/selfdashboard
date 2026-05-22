# Unraid — SelfDashboard Template

Template-Datei: `selfdashboard.xml` (Community Applications / manuell über Template-URL).

## Variable: `NODE_TLS_REJECT_UNAUTHORIZED`

| Wert | Bedeutung |
|------|-----------|
| *(leer)* | Standard — TLS-Zertifikate werden geprüft (empfohlen). |
| `0` | Zertifikatsprüfung aus — nur bei Homelab-HTTPS mit selbstsignierten/abgelaufenen Zertifikaten. |

### Wofür ist das?

SelfDashboard läuft in Node.js im Container. Plugins und Kernfunktionen rufen **ausgehend** HTTPS-URLs auf, z. B.:

- **Kalender** — CalDAV über `https://` (Synology, Nextcloud, …)
- **Fritzbox / Fritz Energy** — HTTPS zur Box
- **Pi-hole, AdGuard, CrowdSec, Docker** — je nach Konfiguration HTTPS zur Verwaltungs-API
- **Plugin-Store** — GitHub (`plugins-pack`)
- **Wetter** — Open-Meteo (öffentliche CA)

Wenn ein Ziel ein **selbstsigniertes** oder internes Zertifikat nutzt, schlägt Node ohne Anpassung mit Zertifikatsfehlern fehl. Statt global `0` zu setzen, ist besser:

1. Gültiges Zertifikat (Let’s Encrypt, interne CA) am Dienst, oder  
2. Eigene CA-Datei über `NODE_EXTRA_CA_CERTS` (fortgeschritten).

`0` deaktiviert die Prüfung für **alle** HTTPS-Verbindungen aus dem Container — auch Open-Meteo und GitHub wären theoretisch angreifbarer. Deshalb im Template **standardmäßig leer** und unter **Advanced** in Unraid.

### Nach Update des Templates

Alte Installationen können noch `NODE_TLS_REJECT_UNAUTHORIZED=0` in **Extra Parameters** haben — dort entfernen und nur bei Bedarf die neue Variable auf `0` setzen.
