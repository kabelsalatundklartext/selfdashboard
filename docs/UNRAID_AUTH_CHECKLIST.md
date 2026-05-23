# Unraid — Auth testen (Checkliste)

Stand: Phase **1a/1b** (Login, Multi-User, Plugin-Whitelist, Store nur Admin).  
Details: [AUTH-ROADMAP.md](./AUTH-ROADMAP.md)

---

## Voraussetzung: Auth muss im **laufenden Image** sein

Auth steckt in der **Kern-App** (Docker-Image), nicht in `plugins-pack`.

| Situation | Was tun |
|-----------|---------|
| Du hast `beta` **gepusht** und GHCR baut automatisch | Unraid: Image **pull** + Container **neu starten** (`ghcr.io/kabelsalatundklartext/selfdashboard:beta`) |
| Noch **nicht** auf GHCR | Lokal bauen & auf Unraid laden, **oder** erst pushen und warten bis Image fertig ist |
| Alter Container ohne Auth | Nach Update: erste URL → **`/setup`** oder **`/login`** (nicht direkt Dashboard) |

Ohne neues Image verhält sich SelfDashboard wie vorher (kein Login).

---

## Unraid — Mounts (unverändert + neu unter `/app/data`)

| Host (Beispiel) | Container | Inhalt |
|-----------------|-----------|--------|
| `.../selfdashboard` | `/app/data` | **Neu:** `auth/auth.db`, `users/<id>/dashboard.json` · Kalender, Logs · Migration: altes `dashboard.json` → Backup `dashboard.json.pre-auth-migrated` |
| `.../selfdashboard/plugins` | `/app/plugins/custom` | Installierte Plugins (global, wie bisher) |

**Backup ab jetzt:** gesamtes Appdata **`/app/data`** (mindestens `auth/` + `users/`).

Optional wie bisher: Docker-Socket, CrowdSec-Mount — nur relevant, wenn Plugins das brauchen **und** für User freigegeben sind.

---

## Env (meist nichts ändern)

| Variable | Wann |
|----------|------|
| *(keine Auth-Env nötig)* | Standard: Auth **an** |
| `SELFDASHBOARD_AUTH_DISABLED=1` | **Nur Dev** — Auth aus |
| `SELFDASHBOARD_SECURE_COOKIES=1` | Nur wenn du **HTTPS** vor dem Container hast (Reverse Proxy) |
| `SELFDASHBOARD_INSECURE_COOKIES=1` | Legacy-Flag (ab Fix meist unnötig); Cookies ohne `Secure` erzwingen |
| `SELFDASHBOARD_AUTH_RESET_PASSWORD=<neu>` | **Einfachster Notfall:** Env setzen → Container restart → einloggen → Env **leeren** → restart. Optional `SELFDASHBOARD_AUTH_RESET_USER=admin` |
| `SELFDASHBOARD_AUTH_RECOVERY=<geheim>` | Alternative: Token für `/recover` (min. 16 Zeichen). Nach Reset Env leeren |
| `TZ=Europe/Berlin` | wie bisher |

Store: `SELFDASHBOARD_PLUGINS_GITHUB_*` im `:beta`-Image meist schon gesetzt.

---

## Erststart nach Auth-Update

1. Browser: `http://UNRAID-IP:3000` (oder deine URL)
2. **Fall A — kein User in DB:** Redirect → **`/setup`** → Admin anlegen  
3. **Fall B — schon Setup:** **`/login`**  
4. Bestehendes **`dashboard.json`** im Appdata-Root wird beim Setup dem **ersten Admin** zugeordnet (Backup-Datei siehe oben)
5. **Strg+F5** nach Image-Wechsel

---

## Was ist eingebaut (Kurz)

- [x] Login / Logout / „Angemeldet bleiben“
- [x] Erst-Setup nur wenn noch kein User
- [x] Pro User: eigenes Dashboard (`/app/data/users/<uuid>/dashboard.json`)
- [x] Rollen: **admin** | **user**
- [x] **Einstellungen → Benutzer** (nur Admin): User anlegen/löschen, **Plugin-Häkchen**
- [x] User: **kein** Plugin-Store (+), **kein** ZIP/Install per API
- [x] User: nur freigegebene Plugins (API + Widgets); z. B. **Docker** ohne Häkchen = blockiert
- [x] Admin: alles + Store + Plugin-Verwaltung
- [x] Passwort zurücksetzen (Admin-UI) — **1c**
- [x] Notfall-Wiederherstellung (`/recover`, Token-Datei oder Env) — **1c**
- [ ] TOTP / 2FA — **Phase 2**
- [x] README/Unraid-Template Auth-Abschnitt — **1c**

---

## Test auf Unraid (abhaken)

### Basis

- [ ] Neues Image läuft (Container-Datum / Version passt)
- [ ] Ohne Login: `/dashboard/home` → Redirect **`/login`**
- [ ] Setup oder Login als Admin funktioniert
- [ ] Navbar: **Benutzername** + Abmelden sichtbar
- [ ] Nach Logout: Dashboard nicht mehr erreichbar

### Migration

- [ ] Altes Layout noch da (als Admin), oder bewusst leeres User-Dashboard
- [ ] Unter Appdata: `users/<id>/dashboard.json` existiert
- [ ] Optional: `dashboard.json.pre-auth-migrated` im Appdata-Root

### Zweiter User

- [ ] **Einstellungen → Benutzer** → User anlegen (Rolle **user**)
- [ ] Nur z. B. `weather`, `bookmarks`, `clock` freigeben → **Speichern**
- [ ] Als User einloggen: **kein** **+** (Plugin-Store) im Bearbeitungsmodus
- [ ] User sieht nur freigegebene Widgets; Docker zeigt Hinweis „nicht freigegeben“ oder fehlt
- [ ] Zwei User: unterschiedliche Widgets/Layouts, kein gegenseitiges Überschreiben

### Sicherheit (optional, Browser F12 → Network)

- [ ] Als User: `POST /api/plugins/upload-zip` → **403**
- [ ] Als User ohne `docker`: `/api/plugins/docker/...` → **403**

### Admin

- [ ] Plugin-Store, Updates, ZIP nur als Admin
- [ ] **Einstellungen → Protokoll** nur als Admin

---

## Bekannte Stolpersteine

| Problem | Lösung |
|---------|--------|
| Kein Login-Screen | Altes Image; pull + restart |
| Login ohne Fehler, bleibt auf `/login` | Session-Cookie (häufig **HTTP** + altes Image mit `Secure`-Cookie). **Fix:** neues Image pullen **oder** `SELFDASHBOARD_INSECURE_COOKIES=1` + Restart |
| Leeres Dashboard nach Setup | Normal bei neuem User-Ordner; Admin nutzt migriertes JSON |
| Plugins „weg“ für User | Whitelist leer — Häkchen setzen |
| Store geht als User | Image zu alt oder Auth disabled |

---

## Wenn alles passt → „weiter“

**Phase 1c** ist umgesetzt (README, Passwort-Reset, Logs-API-Audit, Passwort selbst ändern).

Nächster Block: **Phase 2 — TOTP / 2FA** (oder Abnahme-Tests aus [AUTH-ROADMAP.md](./AUTH-ROADMAP.md)).
