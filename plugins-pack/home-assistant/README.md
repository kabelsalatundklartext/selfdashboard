# Home Assistant

Zeigt ausgewählte [Home-Assistant](https://www.home-assistant.io/)-Entitäten
(Sensoren, Schalter, …) als kompakte Liste: Name links, aktueller Zustand + Einheit rechts.
`on` wird grün, `off` gedimmt und `unavailable` rot dargestellt.

## Setup

1. **Token anlegen:** Home Assistant → **Profil → Sicherheit → Long-Lived Access Tokens**
   → „Token erstellen“. Den Token sicher kopieren (er wird nur einmal angezeigt).
2. **Entity-IDs finden:** Home Assistant → **Entwicklerwerkzeuge → Zustände** —
   dort stehen alle IDs im Format `domain.objekt_id`
   (z. B. `sensor.temperatur_wohnzimmer`, `switch.steckdose`).
3. Widget-Einstellungen: **Basis-URL** (z. B. `http://192.168.1.80:8123`), **Token**
   und die **Entity-IDs** (Komma- oder Zeilen-getrennt, max. 25) eintragen.
4. Optional: Widget-Titel anpassen (leer = ausblenden), Aktualisierungsintervall (Standard 30 s).

Die Abfrage läuft **serverseitig** (`/api/plugins/home-assistant`, REST-API `/api/states/<entity_id>`)
mit SSRF-Schutz; der Token wird verschlüsselt gespeichert.

> Beta-Hinweis: Bitte Probleme (z. B. unerwartete Zustände/Attribute) als Issue mit
> Home-Assistant-Version + Antwort-JSON melden.

---

# Home Assistant (English)

Shows selected Home Assistant entities (sensors, switches, …) as a compact list:
name on the left, current state + unit on the right.
`on` is shown green, `off` dimmed, `unavailable` red.

1. **Create a token:** Home Assistant → **Profile → Security → Long-Lived Access Tokens**
   → "Create token" (shown only once — copy it).
2. **Find entity IDs:** Home Assistant → **Developer Tools → States** —
   IDs use the format `domain.object_id` (e.g. `sensor.living_room_temperature`).
3. Widget settings: enter **base URL** (e.g. `http://192.168.1.80:8123`), **token**
   and the **entity IDs** (comma- or line-separated, max. 25).
4. Optional: widget title (empty = hidden), refresh interval (default 30 s).

Requests run server-side with SSRF protection; the token is stored encrypted.

> Beta note: please report issues with your Home Assistant version + response JSON.
