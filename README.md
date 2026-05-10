# SelfDashboard — Unraid Community Applications Templates

Dieses Verzeichnis enthält die Unraid CA-Templates für SelfDashboard.

## Schnellinstallation über Community Applications

### Schritt 1: Template-Repository in CA eintragen

1. Unraid → **Apps** → **Settings** (Zahnrad oben rechts)
2. Unter **Template Repositories** folgende URL hinzufügen:
   ```
   https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/main/unraid/ca_profile.xml
   ```
3. **Save** klicken

### Schritt 2: Container in dieser Reihenfolge installieren

> ⚠️ **Wichtig:** Reihenfolge beachten!

| # | Container | Beschreibung |
|---|---|---|
| 1 | `selfdashboard-python` | System-Stats, Wetter, Kalender, AdGuard, CrowdSec |
| 2 | `selfdashboard` | Docker API, Unraid Connect API, WebSocket |
| 3 | `selfdashboard-nginx` | Frontend + Reverse Proxy |

Nach der Installation: **http://UNRAID-IP:3000**

---

## Manuelle Installation (ohne CA)

Template-URL direkt in Unraid eingeben:

```
# Node API (Haupt-Container):
https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/main/unraid/kabelsalatundklartext/selfdashboard.xml

# Python API:
https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/main/unraid/kabelsalatundklartext/selfdashboard-python.xml

# Nginx Frontend:
https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/main/unraid/kabelsalatundklartext/selfdashboard-nginx.xml
```

In Unraid: **Docker** → **Add Container** → **Template URL** → URL einfügen → **Apply**

---

## API Keys beschaffen

### Unraid Connect API Key
1. Unraid WebGUI → **Settings** → **Management Access**
2. API Key kopieren
3. In die Container-Einstellungen eintragen

### CrowdSec API Key
```bash
docker exec crowdsec cscli bouncers add selfdashboard
# Ausgegebenen Key kopieren → in selfdashboard-python eintragen
```

### OpenWeatherMap (optional — Open-Meteo ist kostenlos ohne Key)
1. Kostenlos registrieren auf [openweathermap.org](https://openweathermap.org/api)
2. API Key kopieren → in selfdashboard-python eintragen

---

## Verzeichnisstruktur

```
unraid/
├── ca_profile.xml                          ← CA Profil-Registrierung
├── README.md                               ← Diese Datei
├── img/
│   ├── selfdashboard.png                   ← App-Icon (PNG, mind. 128x128)
│   ├── selfdashboard.svg                   ← App-Icon (SVG)
│   ├── screenshot1.png                     ← Screenshot für CA Store
│   └── screenshot2.png                     ← Screenshot für CA Store
└── kabelsalatundklartext/
    ├── selfdashboard.xml                   ← Node.js API Container
    ├── selfdashboard-python.xml            ← Python FastAPI Container
    └── selfdashboard-nginx.xml             ← Nginx Frontend Container
```

---

## Template-Pflege

Templates werden automatisch durch den GitHub Actions Workflow `.github/workflows/validate-templates.yml` auf XML-Gültigkeit geprüft.

Jedes Mal wenn eine neue Version released wird (`git tag v1.x.x`), werden die Container-Images automatisch neu gebaut und gepushed. Unraid CA zeigt dann ein Update-Symbol beim Container an.
