# Security-Scan (Grype / Trivy auf Unraid)

## Wichtig

Der **Docker-Build** ersetzt verwundbare npm-Pakete und prüft mit `audit-picomatch.mjs`.
**GitHub Actions** meldet mit `grype.yaml`: **No vulnerabilities found**.

Viele **Unraid-/Docker-Scanner** (Grype + Trivy Tabs) nutzen **keine** `grype.yaml` aus dem Repo → sie zeigen weiter **7 npm + 3 busybox** Meldungen, obwohl das Image gepatcht ist.

## Was du tun sollst

### 1. Neues Image verwenden (Pflicht)

```bash
docker pull ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

Container in Unraid **neu starten** (gleiche Einstellungen).

### 2. Scanner-Konfiguration (damit die UI leer wird)

Im Tool, das den Screenshot erzeugt (Grype/Trivy Tabs):

| Scanner | Datei aus diesem Repo |
|---------|------------------------|
| **Grype** | `grype.yaml` (im Repo-Root) |
| **Trivy** | `.trivyignore` (im Repo-Root) |

Dateien auf den Unraid-Host kopieren, z. B.:

```bash
# Beispielpfad anpassen
mkdir -p /boot/config/selfdashboard-scan
# grype.yaml und .trivyignore aus dem GitHub-Repo hierhin kopieren
```

In den Plugin-Einstellungen **Config / Ignore file** auf diesen Pfad setzen.

Ohne diese Option: Meldungen **ignorieren** (siehe unten).

### 3. Was du ignorieren kannst (Homelab)

| Meldung | Grund |
|---------|--------|
| picomatch 4.0.3 | False-Positive; im Image ist **4.0.4** (Build-Log: `audit-picomatch: OK`) |
| ip-address / brace-expansion | Alte SBOM-Kopie; Overrides + Harden auf sichere Version |
| busybox CVE-2025-60876 | Alpine-Basis, **kein Fix** verfügbar |

## Prüfen ob das Image wirklich gepatcht ist

```bash
docker run --rm ghcr.io/kabelsalatundklartext/selfdashboard:latest \
  node -e "const f=require('fs'),c=require('crypto'),p='/app/node_modules/picomatch/package.json';
console.log(JSON.parse(f.readFileSync(p)).version);"
```

Erwartung: **4.0.4**
