/**
 * Bilingual catalog metadata (name + description) for plugins whose `plugin.json`
 * description ships in German only. Consumed by {@link displayPluginMeta} so the
 * Plugin Store and config modal follow the dashboard DE/EN setting.
 *
 * Plugins already covered by the i18n translation table (META_KEYS in
 * pluginMetaI18n.ts: iframe, bookmarks, clock, weather, crowdsec, unraid) are
 * intentionally omitted here — that table takes precedence.
 *
 * `nameDe` / `nameEn` are only set where the display name itself is translatable
 * (e.g. "Kalender" → "Calendar"). Brand/product names are left to fall back to
 * the plugin's own `meta.name`.
 */
export interface PluginCatalogEntry {
  de: string
  en: string
  nameDe?: string
  nameEn?: string
}

export const PLUGIN_META_CATALOG: Record<string, PluginCatalogEntry> = {
  adguard: {
    de: 'DNS-Statistik und Schutzstatus per AdGuard-Home-API (Basis-URL + optional Basic-Auth).',
    en: 'DNS stats and protection status via the AdGuard Home API (base URL + optional basic auth).',
  },
  alexa: {
    de: 'Steuert Echo-Geräte (Wiedergabe & Lautstärke, inkl. Amazon Music auf dem Echo), schaltet Alexa-Smart-Home-Geräte und löst Routinen aus. Verbindung per Amazon-Login über einen lokalen Proxy (inoffizielle Alexa-Cloud-API, Beta).',
    en: 'Controls Echo devices (playback & volume, incl. Amazon Music on the Echo), toggles Alexa smart-home devices and triggers routines. Connects via Amazon login through a local proxy (unofficial Alexa cloud API, beta).',
  },
  'apple-music': {
    de: 'Apple-Music-Player im Dashboard: anmelden, Playlist/Album/Station starten, Now-Playing mit Cover und Play/Pause/Skip. Läuft per MusicKit im Browser; erfordert MusicKit-Key (Apple Developer) und ein Apple-Music-Abo.',
    en: 'Apple Music player on your dashboard: sign in, start a playlist/album/station, now-playing with cover art and play/pause/skip. Runs via MusicKit in the browser; requires a MusicKit key (Apple Developer) and an Apple Music subscription.',
  },
  'bambu-cam': {
    nameDe: 'Bambu Lab Kamera',
    nameEn: 'Bambu Lab Camera',
    de: 'Live-Kamerabild von Bambu-Lab-Druckern: P1/A1 direkt (lokal, Port 6000) oder beliebige MJPEG-/Snapshot-URL (z. B. X1 via go2rtc). Bild aktualisiert sich automatisch. (Beta)',
    en: 'Live camera view from Bambu Lab printers: P1/A1 directly (local, port 6000) or any MJPEG/snapshot URL (e.g. X1 via go2rtc). The image refreshes automatically. (Beta)',
  },
  calendar: {
    nameDe: 'Kalender',
    nameEn: 'Calendar',
    de: 'CalDAV + ICS Kalender mit Two-Way-Sync. iCloud, Nextcloud, Fastmail, Posteo … API: /api/plugins/calendar.',
    en: 'CalDAV + ICS calendar with two-way sync. iCloud, Nextcloud, Fastmail, Posteo … API: /api/plugins/calendar.',
  },
  docker: {
    de: 'Docker: kompakte Tabellenansicht oder klassische Zeile. Icons aus Container-Labels + optional CDN (homarr-labs/dashboard-icons). Steuerung & Stats konfigurierbar. API: /api/plugins/docker/containers.',
    en: 'Docker: compact table view or classic row. Icons from container labels + optional CDN (homarr-labs/dashboard-icons). Controls & stats configurable. API: /api/plugins/docker/containers.',
  },
  emby: {
    de: 'Aktive Wiedergaben per Emby-/Jellyfin-kompatibler API: Nutzer, Titel, Gerät, Pause (Basis-URL + API-Key).',
    en: 'Active sessions via the Emby/Jellyfin-compatible API: user, title, device, pause (base URL + API key).',
  },
  'fritz-energy': {
    nameDe: 'FRITZ! Steckdose Energie',
    nameEn: 'FRITZ! Smart Plug Energy',
    de: 'Stromverbrauch FRITZ!Smart Energy / Steckdose per TR-064 (aktuell, heute, 7 Tage, Monat). API: /api/plugins/fritz-energy.',
    en: 'Power consumption of FRITZ!Smart Energy / smart plug via TR-064 (now, today, 7 days, month). API: /api/plugins/fritz-energy.',
  },
  'fritz-smarthome': {
    de: 'FRITZ! Smart Home über das AHA-HTTP-Interface: Heizthermostate (Soll-Temp), Steckdosen (an/aus + Watt), Fensterkontakte und Sensoren. (Beta)',
    en: 'FRITZ! Smart Home via the AHA HTTP interface: heating thermostats (target temp), smart plugs (on/off + watts), window contacts and sensors. (Beta)',
  },
  fritzbox: {
    nameDe: 'Fritzbox Internet Verlauf',
    nameEn: 'Fritzbox Internet History',
    de: 'WAN-Durchsatz-Verlauf per TR-064. Sprache und Y-Achsen-Maximum in den Einstellungen, sonst wie Dashboard bzw. automatisch aus den Messwerten. API: /api/plugins/fritzbox.',
    en: 'WAN throughput history via TR-064. Language and Y-axis maximum in the settings, otherwise like the dashboard or automatic from the readings. API: /api/plugins/fritzbox.',
  },
  'google-home': {
    de: 'Google-Nest-Geräte im Dashboard über die offizielle Smart Device Management (SDM) API: Thermostate (Ist-/Soll-Temperatur, Modus, +/-), Sensoren (Temperatur, Luftfeuchte) und Online-Status von Kameras, Türklingeln und Displays. Verbindung per OAuth (Google Cloud + Device Access). (Beta)',
    en: 'Google Nest devices on your dashboard via the official Smart Device Management (SDM) API: thermostats (current/target temperature, mode, +/-), sensors (temperature, humidity) and online status of cameras, doorbells and displays. Connects via OAuth (Google Cloud + Device Access). (Beta)',
  },
  'home-assistant': {
    de: 'Ausgewählte Home-Assistant-Entitäten (Sensoren, Schalter …) per Long-Lived Token. (Beta)',
    en: 'Selected Home Assistant entities (sensors, switches …) via a long-lived token. (Beta)',
  },
  homematic: {
    de: 'Homematic / RaspberryMatic per JSON-RPC (Login): Heizung (Soll-Temp), Geräte schalten/dimmen, Sensoren & Systemvariablen anzeigen, Programme starten. (Beta)',
    en: 'Homematic / RaspberryMatic via JSON-RPC (login): heating (target temp), switch/dim devices, show sensors & system variables, run programs. (Beta)',
  },
  hue: {
    de: 'Philips-Hue-Lampen und Räume per lokaler Bridge-API: an/aus, Helligkeit, Farbe (echte Lichtfarbe). Karten/Kompakt/Kacheln, Bridge-Koppeln im Plugin. (Beta)',
    en: 'Philips Hue lamps and rooms via the local bridge API: on/off, brightness, color (true light color). Cards/compact/tiles, pair the bridge in the plugin. (Beta)',
  },
  jellyfin: {
    de: 'Aktive Wiedergaben vom Jellyfin-Server: Nutzer, Titel, Fortschritt, Pause — direkt per Sessions-API (Basis-URL + API-Key). Widget-Titel anpassbar.',
    en: 'Active sessions from the Jellyfin server: user, title, progress, pause — directly via the Sessions API (base URL + API key). Customizable widget title.',
  },
  mail: {
    nameDe: 'E-Mail / IMAP',
    nameEn: 'Email / IMAP',
    de: 'Navbar-Badge mit ungelesenen Mails, mehrere IMAP-Konten, Einstellungen unter E-Mail.',
    en: 'Navbar badge with unread mail, multiple IMAP accounts, settings under Email.',
  },
  npm: {
    de: 'Host-Statistik aus Nginx Proxy Manager: Proxy Hosts, Redirections, Streams, 404-Hosts (Login per E-Mail + Passwort, serverseitig). (Beta)',
    en: 'Host stats from Nginx Proxy Manager: proxy hosts, redirections, streams, 404 hosts (login via email + password, server-side). (Beta)',
  },
  openmediavault: {
    de: 'OMV-Systeminfo: Hostname, Version, Uptime, CPU/RAM-Last per RPC-Login. (Beta)',
    en: 'OMV system info: hostname, version, uptime, CPU/RAM load via RPC login. (Beta)',
  },
  opnsense: {
    de: 'OPNsense-Status: Version, Update-Status und Gateways per API-Key/-Secret. (Beta)',
    en: 'OPNsense status: version, update status and gateways via API key/secret. (Beta)',
  },
  parcel: {
    nameDe: 'Paketverfolgung',
    nameEn: 'Parcel Tracking',
    de: 'Sendungsverfolgung für DHL, Hermes und DPD — kostenlos, ohne API-Key. Mehrere Pakete mit Status, letztem Scan, voraussichtlicher Zustellung und Direktlink zum Anbieter. Drei Dichtestufen. API: /api/plugins/parcel/track.',
    en: 'Parcel tracking for DHL, Hermes and DPD — free, no API key. Multiple parcels with status, last scan, estimated delivery and a direct link to the carrier. Three density levels. API: /api/plugins/parcel/track.',
  },
  pihole: {
    de: 'Pi-hole-v6-Statistik wie im Web-Dashboard (Anfragen, blockiert, Anteil, Domains auf Listen). Blocking per Klick. Daten via /api/plugins/pihole.',
    en: 'Pi-hole v6 stats like the web dashboard (queries, blocked, share, domains on lists). Toggle blocking with one click. Data via /api/plugins/pihole.',
  },
  plex: {
    de: 'Aktive Plex-Wiedergaben: Nutzer, Titel, Fortschritt, Pause — serverseitig per X-Plex-Token. (Beta)',
    en: 'Active Plex sessions: user, title, progress, pause — server-side via X-Plex-Token. (Beta)',
  },
  proxmox: {
    de: 'Proxmox-Knoten mit CPU/RAM und laufenden VMs/LXCs per API-Token. (Beta)',
    en: 'Proxmox nodes with CPU/RAM and running VMs/LXCs via API token. (Beta)',
  },
  reolink: {
    nameDe: 'Reolink Kamera',
    nameEn: 'Reolink Camera',
    de: 'Live-Kamerabild von Reolink-Kameras/NVRs (lokale CGI-API): Auto-Snapshot, Online-Status, KI-/Bewegungs-Badges und PTZ-Steuerung. (Beta)',
    en: 'Live camera view from Reolink cameras/NVRs (local CGI API): auto snapshot, online status, AI/motion badges and PTZ control. (Beta)',
  },
  scratchpad: {
    nameDe: 'Notizzettel',
    nameEn: 'Scratchpad',
    de: 'Kurzer Merkzettel — direkt im Widget bearbeitbar, Speichern mit Sicherheitsabfrage.',
    en: 'A quick notepad — editable right in the widget, save with a confirmation prompt.',
  },
  selfstream: {
    de: 'Aktive IPTV-Streams aus dem Selfstream-Admin: Nutzer, Sender/Sendung und Laufzeit. Admin-Passwort wird serverseitig als API-Token genutzt. API: /api/plugins/selfstream.',
    en: 'Active IPTV streams from the Selfstream admin: user, channel/show and runtime. The admin password is used server-side as an API token. API: /api/plugins/selfstream.',
  },
  'selfstream-emby': {
    de: 'Aktive Streams von Selfstream, Emby und Jellyfin in einer gemischten Liste — Quellen-Icon pro Zeile, Widget-Titel anpassbar. Alle Quellen optional.',
    en: 'Active streams from Selfstream, Emby and Jellyfin in one mixed list — source icon per row, customizable widget title. All sources optional.',
  },
  'speedtest-tracker': {
    de: 'Letzter Speedtest aus Speedtest Tracker: Download, Upload, Ping + Zeitpunkt. API-Token aus den Speedtest-Tracker-Einstellungen (Bearer). Widget-Titel anpassbar.',
    en: 'Latest speedtest from Speedtest Tracker: download, upload, ping + timestamp. API token from the Speedtest Tracker settings (Bearer). Customizable widget title.',
  },
  spotify: {
    de: 'Zeigt den aktuell laufenden Spotify-Titel (Cover, Künstler, Fortschritt), steuert die Wiedergabe (Play/Pause/Skip), spult vor/zurück, regelt Lautstärke & Stummschaltung, sucht nach Liedern & Playlists (eigene Playlists direkt sichtbar) und wählt das Wiedergabe-Gerät. Verbindung per OAuth, Steuerung/Abspielen erfordert Spotify Premium.',
    en: 'Shows the currently playing Spotify track (cover, artist, progress), controls playback (play/pause/skip), seeks forward/back, adjusts volume & mute, searches songs & playlists (your own playlists shown directly) and picks the playback device. Connects via OAuth; control/playback requires Spotify Premium.',
  },
  truenas: {
    de: 'TrueNAS-Systeminfo und Pool-Status per REST-API-Key. (Beta)',
    en: 'TrueNAS system info and pool status via REST API key. (Beta)',
  },
  unifi: {
    de: 'UniFi-Netzwerkstatus: WLAN/LAN/WAN, APs, Switches, Clients (Controller-Login, serverseitig). (Beta)',
    en: 'UniFi network status: WLAN/LAN/WAN, APs, switches, clients (controller login, server-side). (Beta)',
  },
  'unraid-docker': {
    de: 'Docker-Container über die Unraid GraphQL API (7.2+): kompakte Tabellenansicht oder klassische Zeile wie beim Docker-Plugin, zweistufige Aktions-Bestätigung, CDN-Icons, granulare CPU/RAM- und Button-Optionen, Live-Stats per WebSocket (optional).',
    en: 'Docker containers via the Unraid GraphQL API (7.2+): compact table view or classic row like the Docker plugin, two-step action confirmation, CDN icons, granular CPU/RAM and button options, live stats via WebSocket (optional).',
  },
  'uptime-kuma': {
    de: 'Status-Page-Übersicht aus Uptime Kuma: kompakte Monitor-Liste (2 Spalten ab 6 Einträgen). API: /api/plugins/uptime-kuma.',
    en: 'Status-page overview from Uptime Kuma: compact monitor list (2 columns from 6 entries). API: /api/plugins/uptime-kuma.',
  },
  zoraxy: {
    de: 'Zoraxy-Übersicht: Proxy-Hosts, Uptime, Requests/Geblockt, Traffic, Redirects, Streams, Blacklist u. m. — Kacheln frei ein-/ausblendbar und sortierbar. (Beta)',
    en: 'Zoraxy overview: proxy hosts, uptime, requests/blocked, traffic, redirects, streams, blacklist and more — tiles freely toggleable and sortable. (Beta)',
  },
}
