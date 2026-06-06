# Plex

Zeigt aktive Wiedergaben deines [Plex Media Servers](https://www.plex.tv/):
Nutzer, Titel (bei Serien: Serie — Episode), Wiedergabe-/Pause-Status und Fortschritt.

## Setup

1. **X-Plex-Token finden:** [app.plex.tv](https://app.plex.tv) öffnen → ein beliebiges Medium
   anklicken → **Medieninfo** (⋯-Menü) → **„XML anzeigen"** → in der URL des neuen Tabs steht
   `X-Plex-Token=...` — diesen Wert kopieren.
2. Widget-Einstellungen: **Basis-URL** des Plex-Servers (z. B. `http://192.168.1.40:32400`,
   Standard-Port 32400) + **X-Plex-Token** eintragen.
3. Optional: Widget-Titel anpassen (leer = ausblenden), Aktualisierungsintervall (Standard 15 s).

Die Abfrage läuft **serverseitig** (`/api/plugins/plex`, Endpoint `/status/sessions`) mit
SSRF-Schutz; der Token wird verschlüsselt gespeichert.

> **Beta-Hinweis:** Getestet mit aktuellen Plex-Media-Server-Versionen. Bei abweichenden
> API-Antworten bitte Issue mit Plex-Version + Antwort-JSON melden.

---

# Plex (English)

Shows active playback sessions on your Plex Media Server: user, title
(for shows: series — episode), play/pause state and progress.

1. **Find your X-Plex-Token:** open [app.plex.tv](https://app.plex.tv) → click any media item →
   **media info** (⋯ menu) → **"View XML"** → the new tab's URL contains `X-Plex-Token=...` —
   copy that value.
2. Widget settings: enter the Plex **base URL** (e.g. `http://192.168.1.40:32400`,
   default port 32400) + the **X-Plex-Token**.
3. Optional: widget title (empty = hidden), refresh interval (default 15 s).

Requests run server-side (`/api/plugins/plex`, endpoint `/status/sessions`) with SSRF
protection; the token is stored encrypted.

> **Beta:** tested against recent Plex Media Server versions. If responses differ,
> please open an issue with your Plex version + response JSON.
