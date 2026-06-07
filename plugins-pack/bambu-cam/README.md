# Bambu Lab Kamera (Beta)

Live-Kamerabild von Bambu-Lab-Druckern direkt im Dashboard.

## Modi
- **P1 / A1 (lokal):** Verbindet sich direkt zum Drucker (Port 6000, TLS) mit `bblp` + Zugangscode und holt das JPEG-Kamerabild. Aktualisiert sich automatisch (1–2 s, einstellbar), flickerfrei.
- **Stream-URL:** Beliebige MJPEG- oder Snapshot-URL (z. B. X1 via go2rtc/OctoEverywhere). Wird vom Plugin geproxyt und angezeigt.

## Einrichtung
- Am Drucker **„LAN Mode Liveview"** aktivieren (Cloud-Betrieb möglich, LAN-Only/Entwicklermodus nicht zwingend).
- **IP** und **Zugangscode** unter Einstellungen → Netzwerk/LAN ablesen.
- Im Widget Quelle wählen, IP + Zugangscode (wird verschlüsselt gespeichert) eintragen.

## Sicherheit
Nur LAN-Adressen erlaubt (10.x, 172.16–31.x, 192.168.x); öffentliche Ziele und Cloud-Metadaten werden blockiert.

> Hinweis: Auf aktueller A1/X1-Firmware ist die Kamera teils RTSP (Port 322). Dann den **Stream-URL-Modus** mit einem Re-Streamer (go2rtc) nutzen.
