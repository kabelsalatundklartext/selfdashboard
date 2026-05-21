# Plugin: E-Mail / IMAP (`mail`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**IMAP-Ungelesen-Badge** in der Navbar (optional Vorschau der Betreffe) plus eigener Tab **Einstellungen → E-Mail** — mehrere Konten, Synology/MailPlus-freundlich, verschlüsselte Passwörter, Klick auf Badge öffnet **Webmail-URL**.

### Voraussetzung

1. Plugin **E-Mail / IMAP** im **Plugin-Store** installieren  
2. **Strg+F5** (Hard-Reload)  
3. **Einstellungen → E-Mail** — mindestens ein Konto anlegen und testen  
4. **Einstellungen → Allgemein → Navbar E-Mail** — Badge aktivieren

### Einrichtung eines Kontos

| Feld | Hinweis |
|------|---------|
| **IMAP-Host** | Nur Hostname oder IP — **kein** `:993` oder Webmail-Pfad im Host-Feld |
| **Port** | Meist **993** mit SSL |
| **Benutzer / Passwort** | Wie im Mail-Client |
| **Webmail-URL** | Wird beim Klick auf den Navbar-Badge geöffnet (z. B. MailPlus-Link) |
| **Abfrage-Intervall** | Sekunden zwischen Hintergrund-Syncs |
| **Ordner-Modus** | Siehe Tabelle unten |

### Speicher & Verschlüsselung

| Thema | Details |
|-------|---------|
| **Datei** | `plugins/custom/mail/mail.json` auf dem **Plugins-Volume** |
| **Migration** | Alte `data/mail/` wird beim ersten Zugriff automatisch übernommen |
| **Passwörter** | **AES-256-GCM** mit **`SELFDASHBOARD_CALENDAR_KEY`** (gleicher Schlüssel wie Kalender) |
| **Schlüssel** | In Docker **fest setzen**, sonst nach Container-Neustart Entschlüsselungsfehler |

### API

| Aufruf | Zweck |
|--------|--------|
| `GET /api/plugins/mail/status` | Cache lesen (Badge-Zahlen) |
| `GET …/status?refresh=1` | Sofort IMAP-Sync |
| `PUT /api/plugins/mail/settings` | Konten speichern |
| `POST /api/plugins/mail/test` | Verbindung testen |
| `GET /api/plugins/mail/unread-preview` | Betreff-Vorschau (wenn aktiviert) |

Legacy: **`/api/mail/…`** leitet auf die neuen Pfade weiter.

### Ordner-Modi

| Modus | Bedeutung |
|-------|-----------|
| `*` | Alle Ordner mit Ungelesen (ohne Papierkorb) |
| `@accounts` | Wie MailPlus: nur `INBOX.Kontoname` |
| `INBOX` o. ä. | Nur dieser Ordner |

### Altersfilter & Synology

- **Altersfilter ungelesen** (Standard **30 Tage**, **`0`** = aus): ignoriert sehr alte `UNSEEN`-UIDs, die MailPlus schon nicht mehr zeigt.  
- **Synology MailPlus:** IMAP `192.168.1.15`, Port **993**, SSL an. Webmail z. B. `http://192.168.1.15:5000/mail/#inbox` — **nicht** `:5000` im IMAP-Host-Feld.

### Navbar-Verhalten

| Anzeige | Bedeutung |
|---------|-----------|
| Zahl + normal | Ungelesene Mails laut IMAP |
| Gelb / rot | Verbindungs- oder Entschlüsselungsproblem — **Einstellungen → E-Mail** prüfen |
| Badge leer trotz Test OK | **Navbar E-Mail** eingeschaltet? Wirklich Ungelesen > 0? |

SelfDashboard filtert gelöschte/gelesene **Geister** (`\Deleted`, `\Seen`), die IMAP noch als `UNSEEN` führt — ggf. in MailPlus Papierkorb leeren und **Alle Konten aktualisieren**.

### Nach Container-Neustart

Passwort **erneut eingeben** und **Speichern**, wenn der Schlüssel fehlt oder gewechselt hat — sonst gelber Punkt, Zähler 0.

### Protokoll

**Einstellungen → Protokoll**, Filter Plugin **`mail`** — IMAP-Fehler, Timeouts, Auth.

---

## English

### Summary

**IMAP unread badge** in the navbar (optional subject preview) plus **Settings → Email** tab — multiple accounts, Synology/MailPlus-friendly, encrypted passwords, badge click opens **webmail URL**.

### Prerequisites

1. Install **Email / IMAP** from the **Plugin Store**  
2. **Ctrl+F5** (hard reload)  
3. **Settings → Email** — add and test at least one account  
4. **Settings → General → Navbar email** — enable badge

### Account setup

| Field | Notes |
|-------|-------|
| **IMAP host** | Hostname or IP only — **no** `:993` or webmail path in host field |
| **Port** | Usually **993** with SSL |
| **User / password** | Same as mail client |
| **Webmail URL** | Opened when clicking navbar badge |
| **Poll interval** | Seconds between background syncs |
| **Folder mode** | See table below |

### Storage & encryption

| Topic | Details |
|-------|---------|
| **File** | `plugins/custom/mail/mail.json` on **plugins volume** |
| **Migration** | Old `data/mail/` migrated on first access |
| **Passwords** | **AES-256-GCM** with **`SELFDASHBOARD_CALENDAR_KEY`** (same as calendar) |
| **Key** | Set a **fixed key** in Docker or decryption fails after recreate |

### API

| Call | Purpose |
|------|---------|
| `GET /api/plugins/mail/status` | Read cache (badge counts) |
| `GET …/status?refresh=1` | Force IMAP sync |
| `PUT /api/plugins/mail/settings` | Save accounts |
| `POST /api/plugins/mail/test` | Test connection |
| `GET /api/plugins/mail/unread-preview` | Subject preview (if enabled) |

Legacy: **`/api/mail/…`** redirects to new paths.

### Folder modes

| Mode | Meaning |
|------|---------|
| `*` | All folders with unread (no trash) |
| `@accounts` | MailPlus-style: `INBOX.AccountName` only |
| `INBOX` etc. | Single folder only |

### Age filter & Synology

- **Unread age filter** (default **30 days**, **`0`** = off): ignores very old `UNSEEN` UIDs MailPlus no longer shows.  
- **Synology MailPlus:** IMAP host `192.168.1.15`, port **993**, SSL on. Webmail e.g. `http://192.168.1.15:5000/mail/#inbox` — **do not** put `:5000` in IMAP host.

### Navbar behaviour

| Display | Meaning |
|---------|---------|
| Number, normal | Unread per IMAP |
| Yellow / red | Connection or decryption issue — check **Settings → Email** |
| Empty after OK test | **Navbar email** enabled? Unread > 0? |

SelfDashboard filters **ghost** `\Deleted` / `\Seen` messages still marked `UNSEEN` — empty trash in MailPlus and **Refresh all accounts** if needed.

### After container recreate

Re-enter password and **Save** if the encryption key changed — otherwise yellow dot, count 0.

### Logs

**Settings → Logs**, filter plugin **`mail`** — IMAP errors, timeouts, auth.
