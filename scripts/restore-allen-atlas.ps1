$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$directory = Join-Path $root 'archive/allen-atlas'
$manifest = Get-Content -LiteralPath (Join-Path $directory 'manifest.json') -Raw | ConvertFrom-Json
$zipPath = Join-Path $directory 'allen-atlas.zip'
if ((Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash -ne $manifest.archiveSha256) { throw 'Archive checksum mismatch.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    # Verify all contents and conflicts before writing anything.
    foreach ($file in $manifest.files) {
        $entry = $zip.GetEntry($file.path)
        if (!$entry -or $entry.Length -ne $file.bytes) { throw "Missing or incorrect entry: $($file.path)" }
        $stream = $entry.Open()
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $hash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') } finally { $stream.Dispose(); $sha.Dispose() }
        if ($hash -ne $file.sha256) { throw "Entry checksum mismatch: $($file.path)" }
        if ($file.path -eq 'ATTRIBUTIONS.md') { continue }
        $destination = [IO.Path]::GetFullPath((Join-Path $root $file.path))
        if (!$destination.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Destination escapes repository.' }
        if ((Test-Path -LiteralPath $destination) -and (Get-FileHash -LiteralPath $destination).Hash -ne $file.sha256) { throw "Existing file differs; refusing overwrite: $destination" }
    }
    foreach ($file in $manifest.files) {
        if ($file.path -eq 'ATTRIBUTIONS.md') { continue }
        $destination = Join-Path $root $file.path
        if (!(Test-Path -LiteralPath $destination)) {
            [IO.Directory]::CreateDirectory((Split-Path $destination -Parent)) | Out-Null
            [IO.Compression.ZipFileExtensions]::ExtractToFile($zip.GetEntry($file.path), $destination, $false)
        }
        if ((Get-FileHash -LiteralPath $destination).Hash -ne $file.sha256) { throw "Restored checksum mismatch: $destination" }
    }
} finally { $zip.Dispose() }
Write-Output 'Allen files restored and verified. Set REACT_APP_ENABLE_ALLEN_ATLAS=true in frontend/.env.local and restart/rebuild the frontend to enable the atlas.'
