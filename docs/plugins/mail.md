# Plugin: E-Mail / IMAP (`mail`)

[← Katalog](README.md)

## Deutsch

### Voraussetzung

Plugin **E-Mail / IMAP** im Store installieren, dann **Strg+F5**.

### Einrichtung

- **Einstellungen → E-Mail** — Konten, Intervall, Test
- **Einstellungen → Allgemein → Navbar E-Mail** — Badge ein/aus

### Speicher

`plugins/custom/mail/mail.json` auf dem Volume (alte `data/mail/` wird beim ersten Zugriff migriert). Passwörter: **AES-256-GCM** (`SELFDASHBOARD_CALENDAR_KEY`).

### API

| Aufruf | Zweck |
|--------|--------|
| `GET /api/plugins/mail/status` | Cache lesen |
| `?refresh=1` | Sofort IMAP-Sync |
| `PUT /api/plugins/mail/settings` | Konten speichern |
| `POST /api/plugins/mail/test` | Verbindung testen |

Legacy: `/api/mail/…` leitet weiter.

### Ordner-Modi

| Modus | Bedeutung |
|-------|-----------|
| `*` | Alle Ordner mit Ungelesen (ohne Papierkorb) |
| `@accounts` | Wie MailPlus: nur `INBOX.Kontoname` |
| `INBOX` o. ä. | Nur dieser Ordner |

**Altersfilter** (Standard 30 Tage, `0` = aus) unter Einstellungen → E-Mail.

### Synology-Beispiel

- IMAP-Host: `192.168.1.15`, Port **993**, SSL an
- Webmail: `http://192.168.1.15:5000/mail/#inbox` — **nicht** `:5000` im IMAP-Host-Feld

### Nach Container-Neustart

Passwort erneut eingeben und **Speichern**, sonst Entschlüsselungsfehler (gelber Punkt in der Navbar).

### Protokoll

**Einstellungen → Protokoll**, Filter Plugin `mail`.

---

## English

Install **Email / IMAP** from the store, then hard-reload.

Configure under **Settings → Email**; toggle **Settings → General → Navbar email**.

Storage: `plugins/custom/mail/mail.json`. API base: `/api/plugins/mail/…` (legacy `/api/mail/…` still works).

Mailbox modes: `*` (all folders), `@accounts` (MailPlus-style), or a single folder name.

Synology: use host without webmail port in IMAP host field. Re-save password after container recreate.

Logs: **Settings → Logs**, filter `mail`.
