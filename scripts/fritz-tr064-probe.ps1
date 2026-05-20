#Requires -Version 5.1
<#
.SYNOPSIS
  TR-064 probe for FRITZ!Box Smart Home (FRITZ!Smart Energy / Homeauto).

.EXAMPLE
  .\scripts\fritz-tr064-probe.ps1 -FritzHost 192.168.1.1 -User selfdashboard2 -Password 'geheim'

.EXAMPLE
  .\scripts\fritz-tr064-probe.ps1 -FritzHost 192.168.1.1 -User selfdashboard2 -Password 'geheim' -UseHttps -InsecureTls
#>
[CmdletBinding()]
param(
  [string] $FritzHost = '192.168.1.1',
  [int] $Port = 49000,
  [Parameter(Mandatory = $true)]
  [string] $User,
  [Parameter(Mandatory = $true)]
  [string] $Password,
  [string] $Ain = '11630 0425503',
  [switch] $UseHttps,
  [switch] $InsecureTls,
  [switch] $SkipSoap,
  [switch] $HttpOnly
)

$ErrorActionPreference = 'Stop'

function Get-CurlExe {
  $c = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $c) { throw 'curl.exe not found (Windows 10+).' }
  return $c.Source
}

function Invoke-FritzGet {
  param(
    [string] $Url,
    [switch] $Insecure
  )
  $curl = Get-CurlExe
  $auth = "${User}:$Password"
  $extra = @()
  if ($Insecure) { $extra += '-k' }
  & $curl -sS @extra --digest -u $auth $Url 2>&1
  if ($LASTEXITCODE -ne 0) { throw "GET failed ($LASTEXITCODE): $Url" }
}

function Invoke-FritzSoap {
  param(
    [string] $ControlUrl,
    [string] $ServiceUrn,
    [string] $Action,
    [string] $BodyInner = '',
    [switch] $Insecure
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
    $extra = @()
    if ($Insecure) { $extra += '-k' }
    & $curl -sS @extra --digest -u $auth -X POST $ControlUrl `
      -H 'Content-Type: text/xml; charset=utf-8' `
      -H "SOAPAction: $soapAction" `
      --data-binary "@$tmp" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "SOAP failed ($LASTEXITCODE): $Action" }
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

function Test-IsHtmlResponse {
  param([string] $Text)
  return ($Text -like '*<html*' -and $Text -like '*<body*')
}

function Get-HtmlHint {
  param([string] $Text)
  if ($Text -match '<title[^>]*>([^<]+)</title>') {
    return "HTML title: $($Matches[1].Trim())"
  }
  $snippet = ($Text -replace '\s+', ' ').Trim()
  if ($snippet.Length -gt 120) { $snippet = $snippet.Substring(0, 120) + '...' }
  return "HTML snippet: $snippet"
}

function Test-Origin {
  param(
    [string] $Origin,
    [switch] $Insecure
  )
  $paths = @(
    '/tr064desc.xml',
    '/tr64desc.xml',
    '/tr064/tr064desc.xml',
    '/tr064dev.xml',
    '/tr064/tr064dev.xml',
    '/igddesc.xml'
  )
  $hits = @()
  Write-Host ""
  Write-Host "=== Origin $Origin ===" -ForegroundColor Cyan

  foreach ($p in $paths) {
    $url = "$($Origin.TrimEnd('/'))$p"
    Write-Host "--- GET $p ---" -ForegroundColor Yellow
    try {
      $xml = Invoke-FritzGet -Url $url -Insecure:$Insecure
    } catch {
      Write-Host "  Error: $_" -ForegroundColor Red
      continue
    }
    if (Test-IsHtmlResponse -Text $xml) {
      Write-Host "  (HTML - not TR-064 XML)" -ForegroundColor DarkYellow
      Write-Host "  $(Get-HtmlHint -Text $xml)" -ForegroundColor DarkGray
      continue
    }
    $types = Get-ServiceTypesFromXml -Xml $xml
    if (-not $types) {
      Write-Host '  No serviceType entries.' -ForegroundColor DarkGray
      continue
    }
    Write-Host "  Services ($($types.Count)):" -ForegroundColor Green
    foreach ($t in $types) {
      $mark = ''
      if ($t -match 'Homeauto|HomeAuto') {
        $mark = '  <-- Smart Home'
        $hits += [pscustomobject]@{ Origin = $Origin; Path = $p; ServiceType = $t; Xml = $xml; Insecure = [bool]$Insecure }
      }
      Write-Host "    $t$mark"
    }
  }
  return $hits
}

$origins = @()
if ($UseHttps) {
  if ($Port -eq 49000) { $Port = 49443 }
  $origins += "https://${FritzHost}:$Port"
} else {
  $origins += "http://${FritzHost}:$Port"
}

Write-Host ''
Write-Host 'FRITZ! TR-064 Probe' -ForegroundColor Cyan
Write-Host "User: $User"
Write-Host ''

$homeautoHits = @()
foreach ($o in $origins) {
  $homeautoHits += Test-Origin -Origin $o -Insecure:$InsecureTls
}

if (-not $HttpOnly -and $homeautoHits.Count -eq 0 -and -not $UseHttps) {
  Write-Host ''
  Write-Host 'No Homeauto on HTTP - trying HTTPS port 49443 ...' -ForegroundColor Magenta
  $homeautoHits += Test-Origin -Origin "https://${FritzHost}:49443" -Insecure:$InsecureTls
}

if ($homeautoHits.Count -eq 0) {
  Write-Host ''
  Write-Host 'No X_AVM-DE_Homeauto / X_HomeAuto in any descriptor.' -ForegroundColor Red
  Write-Host ''
  Write-Host 'What we saw:'
  Write-Host '  - igddesc.xml = WAN only (enough for Fritzbox throughput plugin)'
  Write-Host '  - tr064desc.xml = HTML on port 49000 (login page or web UI redirect)'
  Write-Host ''
  Write-Host 'Try next:'
  Write-Host '  1) Fritz!Box: allow app access + UPnP status (Home Network -> Network)'
  Write-Host '  2) Probe with HTTPS:'
  Write-Host "     .\scripts\fritz-tr064-probe.ps1 -FritzHost $FritzHost -User $User -Password '...' -UseHttps -InsecureTls"
  Write-Host '  3) In plugin settings: Base URL https://192.168.1.1 + self-signed cert checkbox'
  exit 2
}

if ($SkipSoap) {
  Write-Host ''
  Write-Host 'SOAP skipped (-SkipSoap).' -ForegroundColor DarkGray
  exit 0
}

$hit = $homeautoHits[0]
$serviceType = $hit.ServiceType
$escapedType = [regex]::Escape($serviceType)
$pattern = "(?s)<serviceType>\s*$escapedType\s*</serviceType>.*?<controlURL>([^<]+)</controlURL>"
$controlRel = ([regex]::Match($hit.Xml, $pattern)).Groups[1].Value.Trim()
if (-not $controlRel) {
  $controlRel = Get-ControlUrlsFromXml -Xml $hit.Xml | Where-Object { $_ -match 'homeauto' } | Select-Object -First 1
}
if ($controlRel -notmatch '^https?://') {
  $controlUrl = "$($hit.Origin.TrimEnd('/'))$controlRel"
} else {
  $controlUrl = $controlRel
}

Write-Host ''
Write-Host '=== SOAP GetGenericDeviceInfos (device list by index) ===' -ForegroundColor Yellow
Write-Host "  Service: $serviceType"
Write-Host "  URL:     $controlUrl"
Write-Host '  (AVM: use GetGenericDeviceInfos index 0,1,2 - not GetDeviceList)' -ForegroundColor DarkGray
Write-Host '  Tip: node scripts/fritz-tr064-probe.mjs HOST USER PASS' -ForegroundColor DarkGray
$deviceCount = 0
for ($idx = 0; $idx -lt 32; $idx++) {
  $inner = "<NewIndex>$idx</NewIndex>"
  try {
    $gXml = Invoke-FritzSoap -ControlUrl $controlUrl -ServiceUrn $serviceType -Action 'GetGenericDeviceInfos' -BodyInner $inner -Insecure:$hit.Insecure
  } catch {
    break
  }
  if ($idx -eq 0) {
    Write-Host '  --- GetInfo (no args) ---' -ForegroundColor DarkGray
    try {
      $infoXml = Invoke-FritzSoap -ControlUrl $controlUrl -ServiceUrn $serviceType -Action 'GetInfo' -Insecure:$hit.Insecure
      if ($infoXml -notmatch '<s:Fault') {
        Write-Host '  GetInfo: OK' -ForegroundColor Green
      } else {
        Write-Host '  GetInfo fault:' -ForegroundColor Red
        Write-Host $infoXml
      }
    } catch {
      Write-Host "  GetInfo error: $_" -ForegroundColor Red
    }
  }
  if ($gXml -match '<errorCode>713</errorCode>') { break }
  if ($gXml -match '<s:Fault') { Write-Host "  Index $idx fault:" -ForegroundColor Red; Write-Host $gXml; break }
  $ainM = [regex]::Match($gXml, '<NewAIN>([^<]+)</NewAIN>')
  if (-not $ainM.Success) { break }
  $nameM = [regex]::Match($gXml, '<NewDeviceName>([^<]*)</NewDeviceName>')
  $prodM = [regex]::Match($gXml, '<NewProductName>([^<]*)</NewProductName>')
  $pwrM = [regex]::Match($gXml, '<NewMultimeterPower>([^<]*)</NewMultimeterPower>')
  $n = if ($nameM.Success) { $nameM.Groups[1].Value } else { '?' }
  $p = if ($prodM.Success) { $prodM.Groups[1].Value } else { '' }
  $w = if ($pwrM.Success) { [int]$pwrM.Groups[1].Value / 100 } else { $null }
  $line = "    [$idx] $($ainM.Groups[1].Value)  $n  $p"
  if ($null -ne $w) { $line += "  (${w} W)" }
  Write-Host $line -ForegroundColor Green
  $deviceCount++
}
if ($deviceCount -eq 0) {
  Write-Host '  No devices returned.' -ForegroundColor Red
}

$ainDigits = ($Ain -replace '\D', '')
if ($ainDigits.Length -eq 12) {
  $ainFmt = "$($ainDigits.Substring(0, 5)) $($ainDigits.Substring(5))"
  Write-Host ''
  Write-Host "=== SOAP GetSpecificDeviceInfos (AIN $ainFmt) ===" -ForegroundColor Yellow
  $inner = "<NewAIN>$ainFmt</NewAIN>"
  $devXml = Invoke-FritzSoap -ControlUrl $controlUrl -ServiceUrn $serviceType -Action 'GetSpecificDeviceInfos' -BodyInner $inner -Insecure:$hit.Insecure
  foreach ($tag in @('NewMultimeterIsSupported', 'NewMultimeterInfos', 'NewAIN')) {
    $tagPattern = "<$tag>([^<]*)</$tag>"
    if ($devXml -match $tagPattern) {
      Write-Host "  $tag = $($Matches[1])" -ForegroundColor Green
    }
  }
  if ($devXml -notmatch 'NewMultimeter') {
    Write-Host $devXml
  }
}

Write-Host ''
Write-Host 'Probe done.' -ForegroundColor Cyan
