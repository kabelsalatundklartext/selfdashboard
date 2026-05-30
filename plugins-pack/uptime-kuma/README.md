# Plugin: Uptime Kuma (`uptime-kuma`)



## Deutsch



### Kurzbeschreibung



**Uptime Kuma** Status-Page als kompakte Liste — Monitor-Name, Gruppe und Status (OK / Down / Pending / Wartung). Down-Monitore stehen oben. Ab 6 Monitoren: **2 Spalten**.



### Installation



1. Plugin-Store → **Uptime Kuma** installieren oder aktualisieren → **Strg+F5**

2. In Uptime Kuma eine **Status Page** anlegen und Monitore zuweisen

3. Widget **⚙️**: Basis-URL + Slug der Status Page



### Einrichtung (Widget ⚙️)



| Feld | Hinweis |

|------|---------|

| **Basis-URL** | `http://IP:3001` (ohne `/dashboard`) |

| **Status-Page-Slug** | Slug aus der Status-Page-URL, z. B. `uptime` für `/status/uptime` |

| **Aktualisieren** | Standard 30 Sekunden |

| **Gruppenname** | Optional Gruppe neben dem Monitor-Namen |



### API



- Widget → `POST /api/plugins/uptime-kuma`

- Server (Volume `server.mjs`) → `GET {url}/api/status-page/{slug}` + `GET …/heartbeat/{slug}` (öffentliche Status-Page, kein API-Key)



### Layout



Standard **4×3** — gleiche Größe wie **Selfstream-Emby**, damit beide Widgets nebeneinander passen.



### Voraussetzungen



- Uptime Kuma mit mindestens einer **öffentlichen Status Page**

- Kuma vom SelfDashboard-Container aus erreichbar (LAN/IP)



---



## English



### Summary



**Uptime Kuma** status page as a compact list — monitor name, group, and status (up / down / pending / maintenance). Down monitors are listed first. **Two columns** from 6 monitors upward.



### Setup



| Field | Notes |

|-------|-------|

| **Base URL** | `http://IP:3001` (no `/dashboard`) |

| **Status page slug** | From the status page URL, e.g. `uptime` for `/status/uptime` |

| **Refresh** | Default 30 seconds |

| **Group name** | Optionally show the group beside each monitor |



### API



- Widget → `POST /api/plugins/uptime-kuma`

- Server (`server.mjs` from store) → public status-page JSON + heartbeat (no API key)



### Requirements



- At least one **public status page** in Uptime Kuma

- Kuma reachable from the SelfDashboard container

