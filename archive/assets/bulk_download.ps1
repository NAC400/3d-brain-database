# NIH Visible Human Project - Bulk Download Script
# Downloads brain region PNG files from the male dataset

Write-Host "=== NIH Visible Human Project - Brain Slice Downloader ===" -ForegroundColor Green
Write-Host "Downloading brain region files (slices 1100-1150)..." -ForegroundColor Yellow

# Configuration
$baseUrl = "https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/PNG_format/"
$outputDir = "D:\neman\Projects\3d-brain-data\assets\models\brain\visible-human-male\png\"

# Create output directory if it doesn't exist
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
    Write-Host "Created directory: $outputDir" -ForegroundColor Cyan
}

# Download counter
$successCount = 0
$failCount = 0

# Download brain region files (1100-1150 for good brain cross-sections)
Write-Host "`nStarting downloads..." -ForegroundColor Cyan

for ($i = 1100; $i -le 1150; $i++) {
    $filename = "a_vm$i.png"
    $url = $baseUrl + $filename
    $outputFile = $outputDir + "male_$i.png"
    
    Write-Host "[$i/1150] Downloading $filename..." -NoNewline
    
    try {
        # Download with error handling
        Invoke-WebRequest -Uri $url -OutFile $outputFile -ErrorAction Stop -TimeoutSec 30
        
        # Check if file was actually downloaded and has content
        if ((Test-Path $outputFile) -and ((Get-Item $outputFile).length -gt 1KB)) {
            Write-Host " ✅ Success" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " ❌ File empty or corrupt" -ForegroundColor Red
            $failCount++
            if (Test-Path $outputFile) { Remove-Item $outputFile }
        }
    }
    catch {
        Write-Host " ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
        
        # Clean up failed download
        if (Test-Path $outputFile) { Remove-Item $outputFile }
    }
    
    # Small delay to be respectful to the server
    Start-Sleep -Milliseconds 100
}

# Summary
Write-Host "`n=== Download Summary ===" -ForegroundColor Green
Write-Host "✅ Successful downloads: $successCount" -ForegroundColor Green
Write-Host "❌ Failed downloads: $failCount" -ForegroundColor Red
Write-Host "📁 Output directory: $outputDir" -ForegroundColor Cyan

if ($successCount -gt 0) {
    Write-Host "`n🎉 Success! You can now test these files in your React application." -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test loading one file in your React component" -ForegroundColor White
    Write-Host "2. Implement slice navigation in your 3D viewer" -ForegroundColor White
    Write-Host "3. Consider downloading more slices if needed" -ForegroundColor White
} else {
    Write-Host "`n⚠️  No files were successfully downloaded." -ForegroundColor Yellow
    Write-Host "Try the manual browser download method instead." -ForegroundColor White
}

# List downloaded files
if ($successCount -gt 0) {
    Write-Host "`n📋 Downloaded files:" -ForegroundColor Cyan
    Get-ChildItem $outputDir -Name | Select-Object -First 10 | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor White
    }
    if ($successCount -gt 10) {
        Write-Host "  ... and $($successCount - 10) more files" -ForegroundColor Gray
    }
}

Write-Host "`nScript completed." -ForegroundColor Green 