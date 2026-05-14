# Unraid forum posts — SelfDashboard

Copy-paste ready. Adjust version numbers, “tested on”, and links if your repo or image URL changes.

---

## Deutsch

**Titel (Vorschlag):**  
`[Community Apps] SelfDashboard – modulares Home-Dashboard (Docker, Plugins, Unraid-ready)`

**Beitrag:**

Hallo zusammen,

kurz **SelfDashboard** vorstellen: ein schlankes, **selbst gehostetes Home-Dashboard** als **ein Docker-Container** (Next.js 15), mit **Plugin-System**, mehreren Dashboards und **ohne eigene Datenbank**.

### Was ist SelfDashboard?

- Mehrere **Dashboards** mit eigenen URLs (z. B. `/dashboard/home`)
- **Widgets per Plugin** (Bookmarks, Kalender, Wetter, Unraid, Docker, Emby, AdGuard Home, FRITZ!Box-WAN-Verlauf, Iframe, Notizzettel, …)
- **Themes** (Dark, Light, Nord, Catppuccin, Dracula, Solarized), eigenes Logo, eigene Farben pro Dashboard
- **Drag & Drop**, Zoom und Feintuning pro Widget
- Oberfläche **Deutsch & Englisch**

### Unraid / Community Apps

Über **Community Apps** nach **SelfDashboard** suchen und installieren.  
Das Template enthält u. a. Port, optionalen **Docker-Socket** (Host `/var/run/docker.sock` → Container, read-only) für das **Docker-Widget** auf dem **gleichen Host**, sowie Hinweise zu **Socket-Rechten** (z. B. `ExtraParams` `--group-add` mit der GID von `stat -c '%g' /var/run/docker.sock` — je nach Unraid/Docker-Setup).

Wer das Docker-Widget **nicht** braucht, kann das Socket-Mapping im Template leer lassen oder entfernen.

### Docker (manuell, Kurzform)

```bash
docker run -d \
  --name selfdashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Europe/Berlin \
  -v /mnt/user/appdata/selfdashboard:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

*(Letzte Zeile nur bei Bedarf — gleicher Host wie der Container.)*

### Links & Doku

- **Image:** `ghcr.io/kabelsalatundklartext/selfdashboard:latest`
- **Repo / README:** https://github.com/kabelsalatundklartext/selfdashboard  
- **Changelog / neuere Plugin-Details:** `docs/CHANGELOG.md` im Repo  
- **Eigenes Plugin entwickeln:** `docs/PLUGIN_DEV.md` *(Builtin-Plugins sind im Image; eigene Erweiterungen folgen der Doku / eigenem Build.)*

---

Viel Spaß beim Ausprobieren — Rückmeldungen zu Unraid (CA-Template, Socket, Port) gerne im Thread.

*Optional:* `Getestet unter Unraid … / Docker …` ergänzen.

---

## English

**Suggested title:**  
`[Community Apps] SelfDashboard — modular home dashboard (Docker, plugins, Unraid-ready)`

**Post:**

Hi everyone,

Quick intro to **SelfDashboard**: a lightweight **self-hosted home dashboard** in a **single Docker container** (Next.js 15), with a **plugin system**, **multiple dashboards**, and **no database**.

### What you get

- Several **dashboards**, each with its own URL (e.g. `/dashboard/home`)
- **Widgets via plugins** (Bookmarks, Calendar, Weather, Unraid, Docker, Emby, AdGuard Home, FRITZ!Box WAN throughput chart, Iframe, Scratchpad, …)
- **Themes** (Dark, Light, Nord, Catppuccin, Dracula, Solarized), per-dashboard logo and colour overrides
- **Drag & drop**, per-widget zoom and layout tweaks
- UI in **English & German**

### Unraid / Community Apps

Search Community Apps for **SelfDashboard** and install from the template. It typically includes:

- Host port mapping (often **3000** → container **3000**)
- Optional **Docker socket** mount (host `/var/run/docker.sock` → container, read-only) for the **Docker widget** on the **same host** only
- Notes on **socket permissions** (e.g. `ExtraParams` `--group-add` with the GID from `stat -c '%g' /var/run/docker.sock` on the host, depending on your setup)

If you don’t need the Docker widget, clear or remove the socket mapping in the template.

### Manual `docker run` (short)

```bash
docker run -d \
  --name selfdashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Europe/Berlin \
  -v /mnt/user/appdata/selfdashboard:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

*(Omit the last line if you don’t want Docker-in-dashboard; socket must be the same host as the container.)*

### Links & docs

- **Image:** `ghcr.io/kabelsalatundklartext/selfdashboard:latest`
- **Repo / README:** https://github.com/kabelsalatundklartext/selfdashboard  
- **Changelog / recent plugin & API notes:** `docs/CHANGELOG.md` in the repo  
- **Writing your own plugin:** `docs/PLUGIN_DEV.md` *(Shipped plugins are compiled into the image; third-party flow is documented there / may require your own build for now.)*

---

Enjoy — feedback on Unraid (CA template, socket, ports) welcome in this thread.

*Optional footer:* `Tested on Unraid … / Docker …`
