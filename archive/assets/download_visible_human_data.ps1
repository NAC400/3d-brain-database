# NIH Visible Human Project Data Download Script
# This script downloads sample data and key datasets from the Visible Human Project

Write-Host "=== NIH Visible Human Project Data Download ===" -ForegroundColor Green
Write-Host "Starting download process..." -ForegroundColor Yellow

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Cyan
$directories = @(
    "models\brain\visible-human-male",
    "models\brain\visible-human-female", 
    "models\brain\samples",
    "metadata\visible-human",
    "textures\visible-human"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

# Function to download with progress
function Download-FileWithProgress {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$Description
    )
    
    try {
        Write-Host "Downloading $Description..." -ForegroundColor Cyan
        Write-Host "From: $Url" -ForegroundColor Gray
        Write-Host "To: $OutputPath" -ForegroundColor Gray
        
        # Use WebClient for better progress tracking
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($Url, $OutputPath)
        $webClient.Dispose()
        
        if (Test-Path $OutputPath) {
            $fileSize = (Get-Item $OutputPath).Length / 1MB
            Write-Host "✓ Successfully downloaded $Description ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "✗ Failed to download $Description" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Download sample data first (recommended for testing)
Write-Host "`n=== Downloading Sample Data ===" -ForegroundColor Yellow

$sampleDownloads = @(
    @{
        Url = "https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Sample-Data/index.html"
        Path = "metadata\visible-human\sample-index.html"
        Description = "Sample Data Index"
    }
)

foreach ($download in $sampleDownloads) {
    Download-FileWithProgress -Url $download.Url -OutputPath $download.Path -Description $download.Description
}

# Download key PNG format samples (smaller files for testing)
Write-Host "`n=== Downloading PNG Sample Images ===" -ForegroundColor Yellow

# These are actual sample files from the VHP project
$pngSamples = @(
    @{
        Url = "https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/PNG_format/"
        Path = "metadata\visible-human\male-png-index.html"
        Description = "Male PNG Format Index"
    },
    @{
        Url = "https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Female-Images/PNG_format/"
        Path = "metadata\visible-human\female-png-index.html" 
        Description = "Female PNG Format Index"
    }
)

foreach ($download in $pngSamples) {
    Download-FileWithProgress -Url $download.Url -OutputPath $download.Path -Description $download.Description
}

# Create metadata file with download information
Write-Host "`n=== Creating Metadata Files ===" -ForegroundColor Yellow

$metadata = @"
# NIH Visible Human Project - Download Information
Generated: $(Get-Date)

## Data Sources:
- Male Dataset: https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/
- Female Dataset: https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Female-Images/
- Sample Data: https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Sample-Data/

## Dataset Specifications:

### Male Dataset (15GB total):
- MRI: 256x256 pixels, 12-bit grayscale, 4mm intervals
- CT: 512x512 pixels, 12-bit grayscale, 1mm intervals  
- Anatomical: 2048x1216 pixels, 24-bit color, 1mm intervals
- Total cross-sections: 1,871

### Female Dataset (40GB total):
- Same specifications as male
- Anatomical images at 0.33mm intervals (higher resolution)
- Total cross-sections: 5,189
- Enables cubic voxel reconstruction

## Recommended Usage:
1. Start with PNG format for web applications
2. Use Full Color for high-quality visualization
3. Use 70mm for maximum resolution (if needed)

## File Formats Available:
- PNG: Recommended for web use (lossless, directly readable)
- RAW: Original cryosection images
- RGB: High-resolution scanned 70mm film
- Z-compressed: Original compressed format

## License:
Public Domain - No restrictions (as of 2019)
"@

$metadata | Out-File -FilePath "metadata\visible-human\dataset-info.md" -Encoding UTF8
Write-Host "✓ Created dataset metadata file" -ForegroundColor Green

# Create download instructions for large datasets
$largeDatasetInstructions = @"
# Large Dataset Download Instructions

## For downloading the complete datasets manually:

### Step 1: Male Dataset (15GB)
Use browser or download manager for:
https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/PNG_format/

### Step 2: Female Dataset (40GB) 
Use browser or download manager for:
https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Female-Images/PNG_format/

### Step 3: Recommended Download Order:
1. Start with a few sample PNG files from each dataset
2. Test integration in your React/Three.js app
3. Download more sections as needed
4. Consider using 70mm format for final production

### Step 4: File Organization:
- Place Male PNG files in: models/brain/visible-human-male/
- Place Female PNG files in: models/brain/visible-human-female/
- Keep original metadata files in: metadata/visible-human/

## Note: 
Due to large file sizes, consider downloading incrementally
and testing with smaller datasets first.
"@

$largeDatasetInstructions | Out-File -FilePath "metadata\visible-human\large-dataset-instructions.md" -Encoding UTF8
Write-Host "✓ Created large dataset download instructions" -ForegroundColor Green

Write-Host "`n=== Download Script Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check the downloaded index files in metadata/visible-human/" -ForegroundColor White
Write-Host "2. Follow instructions in large-dataset-instructions.md for full downloads" -ForegroundColor White
Write-Host "3. Test with sample data before downloading large datasets" -ForegroundColor White
Write-Host "4. Integrate into your React/Three.js application" -ForegroundColor White 