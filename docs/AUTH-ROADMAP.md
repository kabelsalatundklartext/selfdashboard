# Login & Multi-User — Scope (Option A)

Planungsdokument für **ein SelfDashboard, mehrere Benutzer**, jeweils **eigenes Dashboard**.  
**Phase 2:** TOTP (Authenticator) optional/pflicht für Admin.  
**Stand:** Phase **1a/1b/1c** + **2 (TOTP)** Kern umgesetzt.

Siehe auch: [PLUGINS.md](./PLUGINS.md) (Plugin-Modell: Widgets global installiert, **Konfiguration pro User**, **Nutzung pro User** über Whitelist).

---

## Ziele

| Ziel | Beschreibung |
|------|----------------|
| **Zugriffskontrolle** | Wer die URL erreicht, muss sich anmelden (nicht nur „geheimes LAN“). |
| **Isolation** | User A sieht **nicht** Dashboard/Widgets/Secrets von User B. |
| **Least privilege** | Normale User: nur freigegebene Plugins; **kein** Store, **kein** ZIP, **kein** Docker-Socket ohne Freigabe. |
| **Komfort** | Admin mit **„Angemeldet bleiben“** (lange Session). |
| **Betrieb** | Weiter **ein Container**, ein Plugin-Store, ein Update-Weg (nur Admin bedient). |

**Nicht Ziel in v1:** Passkeys, SSO, E-Mail-„Passwort vergessen“. Stattdessen: **Env-Reset** (`SELFDASHBOARD_AUTH_RESET_PASSWORD`) oder **CLI** — siehe README.

---

## Architektur (Kurz)

```text
Browser ──► Session-Cookie sd_session (HttpOnly)
              │
              ▼
         Middleware (Node, SQLite-Session)
              │
    ┌─────────┴─────────┐
    ▼                   ▼
 /dashboard/*      /api/*
    │                   │
    │                   ├─► Admin-only: Plugin Store, ZIP, Install, …
    │                   └─► Pro Plugin-ID: Whitelist (Rolle user)
    ▼
 /app/data/users/<userId>/dashboard.json
 /app/data/auth/auth.db
     ├─ users, sessions, settings
     └─ user_allowed_plugins (user_id, plugin_id)
```

| Bereich | v1-Entscheidung |
|---------|------------------|
| **Plugins** (`/app/plugins/custom`) | **Global installiert** — nur **Admin** darf installieren/aktualisieren/deinstallieren/hochladen. |
| **Plugin nutzen** | **Pro User (Whitelist)** — API + Widgets + `dashboard.json`; Admin hat immer alle. |
| **Plugin-Config** (Passwörter, URLs, …) | **Pro User** — im jeweiligen Dashboard-State. |
| **Kalender / Mail DB** | **v1:** global unter `/app/data`; API nur wenn Plugin freigegeben (Kalender oft Admin-only in der Praxis). |
| **Logs** (`Settings → Logs`) | **Admin-only** (Anzeigen/Löschen). |
| **Plugin Store / ZIP** | **Admin-only** — UI und API (`403` für `user`). |

---

## Plugin-Freigabe (Whitelist)

### Regeln

| Rolle | Plugins nutzen | Plugins installieren / ZIP / Store |
|--------|----------------|-------------------------------------|
| **admin** | alle | ja |
| **user** | nur Einträge in `user_allowed_plugins` | **nein** |

- Neuer User (`role=user`): Start mit **0** freigegebenen Plugins — Admin setzt Häkchen unter **Einstellungen → Benutzer**.
- **Kritische Plugins** (Docker-Socket, CrowdSec, Unraid, FRITZ!, …) in der Admin-UI markiert; ohne Häkchen: kein Widget, kein `/api/plugins/<id>/…`, keine Legacy-URL (z. B. `/api/docker-containers`).
- `GET/PUT /api/dashboard-state` filtert nicht erlaubte Widgets aus dem JSON.

### Datenbank

```sql
user_allowed_plugins (user_id, plugin_id)  -- PK (user_id, plugin_id)
```

### API (Auszug)

| Route | Wer |
|--------|-----|
| `GET /api/auth/me` | eingeloggt; liefert `allowedPlugins` (`null` = alle) |
| `GET/POST /api/auth/users` | Admin |
| `PUT /api/auth/users/<id>/plugins` | Admin — Whitelist setzen |
| `GET /api/auth/plugin-catalog` | Admin — Liste für Checkboxen |

### Durchsetzung (zweifach)

1. **Middleware** — Session + Admin-Pfade + `plugin_forbidden` pro Plugin-ID  
2. **Route-Handler** — `requirePluginManagement()` / `requirePluginAccess()` in den jeweiligen `route.ts`

---

## Plugin-Verwaltung (nur Admin)

Normale Benutzer dürfen **keine** Plugins auf den Server bringen oder entfernen. Gesperrt in Middleware **und** in den Route-Handlern (`src/lib/auth/pluginManagement.ts`):

| API | Aktion |
|-----|--------|
| `POST /api/plugins/upload-zip` | ZIP hochladen |
| `POST /api/plugins/install-remote` | Install von GitHub |
| `POST /api/plugins/uninstall` | Deinstallieren |
| `POST /api/plugins/reload` | Manifeste neu scannen |
| `POST /api/plugins/seed-custom` | Seed (falls aktiv) |
| `GET /api/plugins/remote-catalog` | Store-Katalog |

**UI:** Plugin-Store-Button (**+** im Bearbeitungsmodus) nur für Admin; Navbar lädt Update-Badge nur als Admin.

---

## Phase 1 — Must-have (v1)

### Auth-Kern

- [x] Erst-Setup `/setup`, Login `/login`, Logout
- [x] Passwörter gehasht (scrypt), Sessions in SQLite, Cookie `sd_session`
- [x] „Angemeldet bleiben“ (Standard 90 Tage) / sonst 24 h (`settings` in DB)
- [x] Middleware: `/dashboard/*`, `/api/*` (öffentlich nur Login/Setup/Logout)

### Benutzer & Rollen

- [x] Rollen **`admin`** \| **`user`**
- [x] Admin: User anlegen/löschen (**Einstellungen → Benutzer**)
- [x] Admin: Plugin-Whitelist pro User
- [x] User: kein Plugin-Store, **kein ZIP-Upload**, keine Install-APIs
- [x] Admin: Passwort zurücksetzen (UI)
- [x] Notfall-Wiederherstellung ohne E-Mail (Env-Reset + optional CLI)

### Daten pro User

- [x] `GET/PUT /api/dashboard-state` → `/app/data/users/<userId>/dashboard.json`
- [x] Migration altes `dashboard.json` → erster Admin

### UI

- [x] Einstellungen → **Benutzer** (Admin): Anlegen, Löschen, Plugin-Freigaben
- [x] Navbar: Benutzername + Abmelden
- [x] Abgelaufene Session → Redirect `/login?next=…`

### API-Absicherung

- [x] `/api/dashboard-state` (Session + Plugin-Filter)
- [x] `/api/plugins/<id>/…` (Session + Whitelist)
- [x] Legacy-Routen (`/api/docker-containers`, …) über gleiche Plugin-ID-Prüfung
- [x] Plugin-Verwaltung (Store, ZIP, …) → **403** für `user`
- [x] `/api/auth/users`, `/api/auth/plugin-catalog` → Admin
- [x] Vollständiger Audit aller übrigen `/api/*` (Logs-Download, …)

### Dokumentation

- [x] Dieses Dokument (`AUTH-ROADMAP.md`)
- [x] README + Unraid-Template (Backup `/app/data/users/` + `/app/data/auth/`)

---

## Phase 1 — Nice-to-have

| Feature | Nutzen |
|---------|--------|
| Presets „Nur Anzeige“ / „Vollzugriff“ für Plugin-Whitelist | Schnellere User-Pflege |
| Plugin-Anzeigenamen in Benutzer-UI (aus `plugin.json`) | **Umgesetzt** (Name + ID) |
| User Passwort selbst ändern | **Einstellungen → Allgemein** (umgesetzt) |
| Rate-Limit Login | Brute-Force |
| Session-Liste / alle Geräte abmelden | Security |
| i18n EN für Auth-UI | Konsistenz |

---

## Phase 2 — TOTP / 2FA

- [x] TOTP pro User (optional) — **Einstellungen → Allgemein → Zwei-Faktor**
- [x] Login: Passwort → `/login/totp` (6-stelliger Code oder Backup-Code)
- [x] 8 Backup-Codes (einmalig, gehasht)
- [x] Admin-Policy: „Admins müssen 2FA nutzen“ (Checkbox, nur Admin)
- [ ] Rate-Limit Login/TOTP
- [ ] QR-Code-Bild (aktuell: Secret + otpauth-URI als Text)

---

## Abnahme-Kriterien (Auth v1)

- [ ] Ohne Login: kein Dashboard, keine API-Daten
- [ ] Zwei User: getrennte Dashboards, keine gegenseitige Sichtbarkeit
- [ ] User **ohne** `docker` in Whitelist: `curl /api/plugins/docker/…` → **403**
- [ ] User: `POST /api/plugins/upload-zip` → **403** (auch per curl)
- [ ] User: kein **+** / Plugin-Store in der UI
- [ ] Admin: Whitelist setzen → User sieht nur freigegebene Widgets
- [ ] „Angemeldet bleiben“ + Logout wie spezifiziert
- [ ] Migration `dashboard.json` nach Update

---

## Zeitleiste (Orientierung)

| Phase | Inhalt | Status |
|-------|--------|--------|
| **1a** | Auth-Kern, Login, Middleware | erledigt |
| **1b** | Pro-User-State, Plugin-Whitelist, API Plugin-Gates | erledigt |
| **1c** | README/Unraid, Passwort-Reset, API-Audit Rest | erledigt |
| **2** | TOTP / 2FA | **Beta** (Kern umgesetzt) |

---

## Zusammenfassung

| | |
|--|--|
| **Kernidee** | Ein System, getrennte Dashboard-Daten, **feine Plugin-Rechte** pro User |
| **Sicherheit Homelab** | Docker & Co. nur mit Admin-Freigabe; **niemand** außer Admin installiert Plugins |
| **Admin-Aufgaben** | User pflegen, Plugins freigeben, Store/Updates |
| **Später** | TOTP (Phase 2) |

**Dev-Notaus:** `SELFDASHBOARD_AUTH_DISABLED=1` — nur lokal, nicht in Production.

Bei Implementierung: Label `auth-v1`; Auth-Änderungen nicht mit reinen Plugin-UI-Releases mischen.
