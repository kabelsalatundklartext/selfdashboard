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

Install **Email / IMAP** from the store, then hard-reload.

Configure under **Settings → Email**; toggle **Settings → General → Navbar email**.

Storage: `plugins/custom/mail/mail.json`. API base: `/api/plugins/mail/…` (legacy `/api/mail/…` still works).

Mailbox modes: `*` (all folders), `@accounts` (MailPlus-style), or a single folder name.

Synology: use host without webmail port in IMAP host field. Re-save password after container recreate.

Logs: **Settings → Logs**, filter `mail`.
