# Optional: alte Strom-Plugin-Daten und leere Ordner entfernen (nach Entfernen des fritz-energy-Plugins).
$root = Split-Path -Parent $PSScriptRoot
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $root 'plugins\fritz-energy')
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $root 'src\app\api\fritz-energy')
$data = Join-Path $root 'data\fritz-energy'
if (Test-Path $data) {
  Remove-Item -Recurse -Force $data
  Write-Host "Removed $data"
}
Write-Host 'Cleanup done.'
