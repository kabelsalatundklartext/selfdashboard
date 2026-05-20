#Requires -Version 5.1
<#
.SYNOPSIS
  TR-064-Probe für FRITZ!Box Smart Home (FRITZ!Smart Energy / Homeauto).

.DESCRIPTION
  Liest Descriptor-XMLs (tr064desc, igddesc, …), listet alle serviceType-Einträge
  und testet optional GetDeviceList / GetSpecificDeviceInfos per SOAP.

  Voraussetzungen:
  - curl.exe (Windows 10+)
  - FRITZ!Box: Heimnetz → Netzwerk → Netzwerkeinstellungen:
    „Zugriff für Apps zulassen“ + „Statusinformationen über UPnP senden“
  - TR-064-Benutzer mit Passwort (nicht nur Weboberfläche)

.EXAMPLE
  .\scripts\fritz-tr064-probe.ps1 -Host 192.168.1.1 -User selfdashboard2 -Password 'geheim'

.EXAMPLE
  .\scripts\fritz-tr064-probe.ps1 -Host 192.168.1.1 -User selfdashboard2 -Password 'geheim' -Ain '11630 0425503'
#>
[CmdletBinding()]
param(
  [string] $Host = '192.168.1.1',
  [int] $Port = 49000,
  [Parameter(Mandatory = $true)]
  [string] $User,
  [Parameter(Mandatory = $true)]
  [string] $Password,
  [string] $Ain = '11630 0425503',
  [switch] $UseHttps,
  [switch] $SkipSoap
)

$ErrorActionPreference = 'Stop'

function Get-CurlExe {
  $c = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $c) { throw 'curl.exe nicht gefunden (Windows 10+).' }
  return $c.Source
}

function Invoke-FritzGet {
  param([string] $Url)
  $curl = Get-CurlExe
  $auth = "${User}:$Password"
  & $curl -sS --digest -u $auth $Url 2>&1
  if ($LASTEXITCODE -ne 0) { throw "GET fehlgeschlagen ($LASTEXITCODE): $Url" }
}

function Invoke-FritzSoap {
  param(
    [string] $ControlUrl,
    [string] $ServiceUrn,
    [string] $Action,
    [string] $BodyInner = ''
  )
  $curl = Get-CurlExe
  $auth = "${User}:$Password"
  $envelope = @"
<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:$Action xmlns:u="$ServiceUrn">$BodyInner</u:$Action>
</s:Body>
</s:Envelope>
"@
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($tmp, $envelope, [System.Text.UTF8Encoding]::new($false))
    $soapAction = "`"$ServiceUrn#$Action`""
    & $curl -sS --digest -u $auth -X POST $ControlUrl `
      -H 'Content-Type: text/xml; charset=utf-8' `
      -H "SOAPAction: $soapAction" `
      --data-binary "@$tmp" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "SOAP fehlgeschlagen ($LASTEXITCODE): $Action" }
  } finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Get-ServiceTypesFromXml {
  param([string] $Xml)
  [regex]::Matches($Xml, '<serviceType>([^<]+)</serviceType>') |
    ForEach-Object { $_.Groups[1].Value.Trim() } |
    Select-Object -Unique
}

function Get-ControlUrlsFromXml {
  param([string] $Xml)
  [regex]::Matches($Xml, '<controlURL>([^<]+)</controlURL>') |
    ForEach-Object { $_.Groups[1].Value.Trim() } |
    Select-Object -Unique
}

$scheme = if ($UseHttps) { 'https' } else { 'http' }
if ($UseHttps -and $Port -eq 49000) { $Port = 49443 }
$origin = "${scheme}://${Host}:${Port}"
$paths = @(
  '/tr064desc.xml',
  '/tr064/tr064desc.xml',
  '/tr064dev.xml',
  '/tr064/tr064dev.xml',
  '/igddesc.xml'
)

Write-Host ""
Write-Host "FRITZ! TR-064 Probe" -ForegroundColor Cyan
Write-Host "Origin: $origin"
Write-Host "User:   $User"
Write-Host ""

$homeautoHits = @()

foreach ($p in $paths) {
  $url = "$origin$p"
  Write-Host "=== GET $p ===" -ForegroundColor Yellow
  try {
    $xml = Invoke-FritzGet -Url $url
  } catch {
    Write-Host "  Fehler: $_" -ForegroundColor Red
    continue
  }
  if ($xml -match '<html' -and $xml -match '<body') {
    Write-Host "  (HTML-Antwort — falscher Port oder keine TR-064-URL)" -ForegroundColor DarkYellow
    continue
  }
  $types = Get-ServiceTypesFromXml -Xml $xml
  if (-not $types) {
    Write-Host "  Keine serviceType-Einträge." -ForegroundColor DarkGray
    continue
  }
  Write-Host "  Dienste ($($types.Count)):" -ForegroundColor Green
  foreach ($t in $types) {
    $mark = ''
    if ($t -match 'Homeauto') { $mark = '  <-- Smart Home'; $homeautoHits += [pscustomobject]@{ Path = $p; ServiceType = $t; Xml = $xml } }
    Write-Host "    $t$mark"
  }
  $ctl = Get-ControlUrlsFromXml -Xml $xml | Where-Object { $_ -match 'homeauto' }
  if ($ctl) {
    Write-Host "  controlURL (homeauto):" -ForegroundColor Green
    $ctl | ForEach-Object { Write-Host "    $_" }
  }
}

Write-Host ""
if ($homeautoHits.Count -eq 0) {
  Write-Host "Kein X_AVM-DE_Homeauto in keiner Descriptor-Datei gefunden." -ForegroundColor Red
  Write-Host @"

Mögliche Ursachen:
  1) Smart Home in der FRITZ!Box deaktiviert oder kein DECT/Energy-Gerät gekoppelt
  2) TR-064 nur über andere URL — in der Fritzbox-Weboberfläche prüfen
  3) FRITZ!OS-Version nutzt anderen Dienstnamen — Ausgabe oben an Support schicken

Box-Einstellungen (Heimnetz → Netzwerk → Netzwerkeinstellungen):
  - Zugriff für Apps zulassen
  - Statusinformationen über UPnP senden
"@ -ForegroundColor DarkYellow
  exit 2
}

if ($SkipSoap) {
  Write-Host "SOAP-Tests übersprungen (-SkipSoap)." -ForegroundColor DarkGray
  exit 0
}

$hit = $homeautoHits[0]
$serviceType = $hit.ServiceType
$controlRel = ([regex]::Match(
  $hit.Xml,
  "(?s)<serviceType>\s*$([regex]::Escape($serviceType))\s*</serviceType>.*?<controlURL>([^<]+)</controlURL>"
)).Groups[1].Value.Trim()
if (-not $controlRel) {
  $controlRel = (Get-ControlUrlsFromXml -Xml $hit.Xml | Where-Object { $_ -match 'homeauto' } | Select-Object -First 1)
}
if ($controlRel -notmatch '^https?://') {
  $controlUrl = "$($origin.TrimEnd('/'))$controlRel"
} else {
  $controlUrl = $controlRel
}

Write-Host "=== SOAP GetDeviceList ===" -ForegroundColor Yellow
Write-Host "  Service: $serviceType"
Write-Host "  URL:     $controlUrl"
$listXml = Invoke-FritzSoap -ControlUrl $controlUrl -ServiceUrn $serviceType -Action 'GetDeviceList'
if ($listXml -match '<NewDeviceList>([\s\S]*?)</NewDeviceList>') {
  $raw = $Matches[1].Trim()
  Write-Host "  Geräte (Rohliste):" -ForegroundColor Green
  $raw -split "`n" | ForEach-Object { $line = $_.Trim(); if ($line) { Write-Host "    $line" } }
} else {
  Write-Host $listXml
}

$ainDigits = ($Ain -replace '\D', '')
if ($ainDigits.Length -eq 12) {
  $ainFmt = "$($ainDigits.Substring(0,5)) $($ainDigits.Substring(5))"
  Write-Host ""
  Write-Host "=== SOAP GetSpecificDeviceInfos (AIN $ainFmt) ===" -ForegroundColor Yellow
  $inner = "<NewAIN>$ainFmt</NewAIN>"
  $devXml = Invoke-FritzSoap -ControlUrl $controlUrl -ServiceUrn $serviceType -Action 'GetSpecificDeviceInfos' -BodyInner $inner
  foreach ($tag in @('NewMultimeterIsSupported', 'NewMultimeterInfos', 'NewAIN')) {
    if ($devXml -match "<$tag>([^<]*)</$tag>") {
      Write-Host "  $tag = $($Matches[1])" -ForegroundColor Green
    }
  }
  if ($devXml -notmatch 'NewMultimeter') {
    Write-Host $devXml
  }
} else {
  Write-Host "AIN übersprungen (12 Ziffern erwartet): $Ain" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Probe fertig." -ForegroundColor Cyan
