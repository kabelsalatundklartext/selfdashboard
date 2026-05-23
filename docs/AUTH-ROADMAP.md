# Login & Multi-User — Scope (Option A)

Planungsdokument für **ein SelfDashboard, mehrere Benutzer**, jeweils **eigenes Dashboard**.  
**Phase 2:** TOTP (Authenticator) optional/pflicht für Admin.  
Stand: Konzept — noch nicht implementiert.

Siehe auch: [PLUGINS.md](./PLUGINS.md) (Plugin-Modell bleibt: Widgets global, **Konfiguration pro User**).

---

## Ziele

| Ziel | Beschreibung |
|------|----------------|
| **Zugriffskontrolle** | Wer die URL erreicht, muss sich anmelden (nicht nur „geheimes LAN“). |
| **Isolation** | User A sieht **nicht** Dashboard/Widgets/Secrets von User B. |
| **Komfort** | Admin (und optional alle) mit **„Angemeldet bleiben“** (lange Session), nicht täglich Passwort + TOTP. |
| **Betrieb** | Weiter **ein Container**, ein Plugin-Store, ein Update-Weg. |

**Nicht Ziel in v1:** Passkeys, SSO, E-Mail-„Passwort vergessen“, Mandanten mit eigenem Container.

---

## Architektur (Kurz)

```text
Browser ──► Session-Cookie (HttpOnly)
              │
              ▼
         Middleware (geschützte Routen)
              │
    ┌─────────┴─────────┐
    ▼                   ▼
 /dashboard/*      /api/*
    │                   │
    ▼                   ▼
 User-Kontext      gleiche Session
    │
    ▼
 /app/data/users/<userId>/dashboard.json
 /app/data/auth/users.json (oder SQLite)
 /app/data/auth/sessions.json
```

| Bereich | v1-Entscheidung |
|---------|------------------|
| **Plugins** (`/app/plugins/custom`) | **Global** — alle User nutzen dieselben installierten Widgets. |
| **Plugin-Config** (FRITZ-Passwort, URLs, …) | **Pro User** — liegt im jeweiligen Dashboard-State. |
| **Kalender / Mail DB** | **v1: Admin-only** oder ein gemeinsamer Kalender pro Instanz (siehe Offene Punkte). |
| **Logs** (`Settings → Logs`) | **v1: Admin-only**. |
| **Plugin Store** | **v1: Admin-only** (Install/Update betrifft alle). |

---

## Phase 1 — Must-have (v1)

Ohne diese Punkte ist Option A im Homelab **nicht sinnvoll abnahmefähig**.

### Auth-Kern

- [ ] **Erst-Setup:** Beim ersten Start (kein User) → Wizard „Admin anlegen“ (Benutzername + Passwort).
- [ ] **Login-Seite** `/login`, Logout (Cookie löschen).
- [ ] Passwörter nur **gehasht** speichern (bcrypt oder argon2), niemals Klartext.
- [ ] **Session** serverseitig (zufällige ID + Ablaufzeit), Cookie: `HttpOnly`, `SameSite=Lax`, `Secure` wenn HTTPS.
- [ ] **„Angemeldet bleiben“** (Checkbox): lange Session (z. B. 30–90 Tage, Admin-konfigurierbar).
- [ ] Ohne Haken: kurze Session (z. B. 24 h oder Browser-Session).
- [ ] **Middleware:** Alle `/dashboard/*` und **alle** `/api/*` (außer `/api/auth/*` und Setup) → 401 ohne gültige Session.

### Benutzer & Rollen

- [ ] Rollen: **`admin`** | **`user`** (keine feineren Rechte in v1).
- [ ] **Admin:** User anlegen, löschen, Rolle setzen, Passwort zurücksetzen (durch Admin).
- [ ] **User:** nur eigenes Dashboard, keine User-Verwaltung, kein Plugin-Store.

### Daten pro User

- [ ] Persistenz: `GET/PUT /api/dashboard-state` schreibt/liest **nur** die Datei des eingeloggten Users.
- [ ] Pfad z. B. `/app/data/users/<userId>/dashboard.json`.
- [ ] **Migration:** Bestehende `/app/data/dashboard.json` → Dashboard des ersten Admin-Users (einmalig beim Setup).

### Admin-Einstellungen (minimal)

- [ ] Session-Dauer: Standard für „Remember me“ (Tage).
- [ ] Session-Dauer: ohne „Remember me“ (Stunden).

### UI

- [ ] Einstellungen → neuer Bereich **„Benutzer“** (nur Admin): Liste, Anlegen, Löschen.
- [ ] Navbar/Profil: angemeldet als … + **Abmelden**.
- [ ] Ungültige/abgelaufene Session → Redirect `/login?next=…`.

### API-Absicherung (Checkliste)

Jede Route muss Session prüfen; sonst Umgehung per `curl`.

- [ ] `/api/dashboard-state`
- [ ] `/api/plugins/*` (Gateway + alle Plugin-Handler)
- [ ] Legacy/Core: `/api/weather`, `/api/adguard`, `/api/fritz-energy`, Kalender, Mail, Docker, CrowdSec, Logs, …
- [ ] **Ausnahmen:** `POST /api/auth/login`, `GET /api/auth/setup-status`, Setup-Endpunkte

### Dokumentation

- [ ] README + Unraid-Template: Auth aktiv, Erst-Setup, Backup von `/app/data/users/` und `/app/data/auth/`.

**Geschätzter Aufwand Must-have:** ca. **12–18 Personentage** (1 Entwickler, Projekt bekannt).

---

## Phase 1 — Nice-to-have (kann warten)

Erhöht Qualität und Komfort, v1 funktioniert aber auch ohne.

| Feature | Nutzen | Aufwand |
|---------|--------|---------|
| User **Passwort selbst ändern** (eingeloggt) | Weniger Admin-Arbeit | ~0,5–1 d |
| **Letzter Admin** darf nicht gelöscht werden | Kein Lockout | ~0,25 d |
| Session-Liste / „alle Geräte abmelden“ | Security nach Diebstahl | ~1–2 d |
| **Rate-Limit** Login (z. B. 5/min/IP) | Brute-Force erschweren | ~0,5–1 d |
| Audit-Log (Login, User angelegt) | Nachvollziehbarkeit | ~1–2 d |
| **Kiosk-Link** (read-only Token-URL, kein Login) | Wand-Tablet ohne Secrets | ~2–4 d |
| Kalender/Mail **pro User** | Echte Mandanten-Trennung | ~3–5 d |
| i18n EN für Auth-UI | Konsistenz | ~0,5–1 d |

**Empfehlung:** Nach Must-have v1 aus Nutzerfeedback die Top-2 Nice-to-haves wählen (oft: Passwort ändern + Rate-Limit).

---

## Phase 2 — TOTP / 2FA (nach v1)

| Feature | Priorität |
|---------|-----------|
| TOTP aktivieren (QR + Authenticator-App) | Hoch |
| **Backup-Codes** (10 Stück, einmal anzeigen) | Hoch |
| Beim Login: Passwort **dann** TOTP (nur wenn aktiviert) | Hoch |
| **Admin-Pflicht** für Rolle `admin` (Policy) | Mittel |
| User: TOTP optional | Mittel |
| TOTP **nicht** bei jedem Seitenaufruf, nur bei neuem Login | Pflicht |

**Nicht in Phase 2:** E-Mail-OTP (SMTP-Pflege), SMS, Passkeys.

**Geschätzter Aufwand:** ca. **+3–5 Personentage** auf stabiler v1.

---

## Phase 3 — Später (bewusst ausklammern)

| Feature | Warum später |
|---------|----------------|
| **OIDC/SSO** (Google, Microsoft) | Extra Provider, Redirect-URLs, Token-Refresh |
| **WebAuthn / Passkeys** | Guter UX, aber eigene Implementierung |
| 2FA bei **kritischen Aktionen** (FRITZ aus, User löschen) | Braucht Action-Tokens |
| Feingranulare Rechte (pro Dashboard teilen) | Komplexität |
| Öffentliches Registrieren | Homelab meist unerwünscht |

---

## Offene Punkte (vor Start klären)

1. **Kalender:** Ein Kalender für alle, pro User, oder nur Admin?  
   → **v1-Vorschlag:** unverändert global unter `/app/data`, nur Admin konfiguriert; User ohne Kalender-Admin-API.

2. **Mail-Plugin (IMAP):** Credentials pro User im eigenen Dashboard-State — reicht das?  
   → **Ja**, wenn Mail-Widget nur User-State nutzt.

3. **Kiosk / Wand-Tablet:** Login jedes Mal OK, oder read-only Token (Nice-to-have)?

4. **Bestehende Installationen:** Automatische Migration beim ersten Start nach Update?  
   → **Ja**, Must-have.

5. **Reverse Proxy:** Auth nur in App oder **zusätzlich** NPM/Authelia?  
   → Beides möglich; App-Auth ist für Multi-User-Daten **nötig**, Proxy optional extra Schicht.

---

## MVP-Abkürzung (wenn Zeit knapp)

Wenn nur **~1 Woche** Zeit ist, verkleinerte v1:

- Must-have Auth + pro-User `dashboard.json`
- User **nur** per Datei/CLI anlegen (keine Admin-UI)
- Kein „Passwort zurücksetzen“-UI
- Kalender/Store/Logs: alles nur Admin

→ Schnell sicherer als heute, aber unbequem für User-Verwaltung. **Nicht** empfohlen, wenn Option A ernst gemeint ist.

---

## Abnahme-Kriterien (v1 fertig)

- [ ] Ohne Login: kein Dashboard, keine API-Daten (401/Redirect).
- [ ] Zwei Test-User: unterschiedliche Widgets/Layouts, keine gegenseitige Sichtbarkeit.
- [ ] „Angemeldet bleiben“: nach Browser-Neustart noch eingeloggt (innerhalb Frist).
- [ ] Logout: Cookie weg, Zugriff blockiert.
- [ ] Admin kann User anlegen/löschen; letzter Admin geschützt (wenn Nice-to-have drin).
- [ ] Alte `dashboard.json` nach Update als Admin-Dashboard vorhanden.
- [ ] Plugin-Store nur als Admin; normaler User erhält 403.

---

## Zeitleiste (Orientierung)

| Phase | Inhalt | Kalender (Vollzeit) |
|-------|--------|---------------------|
| **1a** | Auth-Kern, Middleware, Login | Woche 1 |
| **1b** | Pro-User-State, Migration, API-Audit | Woche 2 |
| **1c** | Admin-UI, Tests, Doku | Woche 2–3 |
| **2** | TOTP + Backup-Codes | +1 Woche |

Nebenbei (2–3 Abende/Woche): eher **6–10 Wochen** bis v1.

---

## Zusammenfassung

| | |
|--|--|
| **Kernidee** | Option A: ein System, getrennte Dashboard-Daten pro User |
| **Must-have** | Login, Sessions, Remember Me, Admin/User, API überall geschützt |
| **Später** | TOTP für Admin (Phase 2) |
| **Aufwand v1** | ~12–18 Personentage (solide) |
| **Sparen** | Kein 2FA in v1, kein Kiosk-Token, Kalender global |

Bei Implementierung: eigenes Issue/PR-Label `auth-v1`, Änderungen nicht mit Plugin-Layout-Releases vermischen.
