# Philips Hue

Steuert Philips-Hue-Lampen und Räume über die **lokale Bridge-API** — kein
Philips-Cloud-Account nötig. An/aus schalten, Helligkeit per Schieberegler,
Umschalter zwischen **Räumen** und einzelnen **Lampen**.

## Setup

1. **Bridge-IP** herausfinden (Hue-App → Einstellungen → Bridge, oder Router-Geräteliste).
2. Im Widget → Einstellungen die **Bridge-IP** eintragen (z. B. `192.168.1.50`).
3. Den **runden Knopf** auf der Hue Bridge drücken.
4. Innerhalb von 30 Sekunden auf **„🔗 Bridge koppeln"** klicken — der API-Key
   wird automatisch erzeugt und **verschlüsselt** gespeichert.

Optional: Standard-Ansicht (Räume/Lampen), Aktualisierungsintervall, Widget-Titel.

Die Abfrage läuft **serverseitig** (`/api/plugins/hue`) mit SSRF-Schutz; gesteuert
wird über die Hue-v1-API (`/api/<key>/groups` bzw. `/lights`).

> Beta-Hinweis: getestet gegen die lokale Hue-v1-Bridge-API. Bei Problemen bitte
> Bridge-Modell/Firmware angeben.

---

# Philips Hue (English)

Control Philips Hue lights and rooms via the **local bridge API** — no Philips
cloud account needed. Toggle on/off, brightness slider, switch between **rooms**
and individual **lights**.

1. Find the **bridge IP** (Hue app → Settings → Bridge, or your router).
2. Widget settings → enter the **bridge IP**.
3. Press the **round button** on the Hue Bridge.
4. Click **“🔗 Pair bridge”** within 30 seconds — the API key is created and
   stored encrypted.

Requests run server-side with SSRF protection via the Hue v1 API.
