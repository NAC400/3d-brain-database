# Download Free 3D Brain Models
# This script downloads anatomically accurate brain models from BodyParts3D

Write-Host "🧠 Downloading Free 3D Brain Models..." -ForegroundColor Cyan

# Create models directory
$modelsDir = "public\models\brain"
if (!(Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force
    Write-Host "✓ Created models directory: $modelsDir" -ForegroundColor Green
}

# Download BodyParts3D brain models
Write-Host "📥 Downloading BodyParts3D brain models..." -ForegroundColor Yellow

try {
    # Clone the BodyParts3D repository to a temporary directory
    $tempDir = "temp_bodyparts3d"
    
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
    
    Write-Host "⬇️  Cloning BodyParts3D repository..." -ForegroundColor Yellow
    git clone --depth 1 https://github.com/Kevin-Mattheus-Moerman/BodyParts3D.git $tempDir
    
    if (Test-Path "$tempDir\assets\stl") {
        Write-Host "✓ Repository cloned successfully" -ForegroundColor Green
        
        # Copy key brain model files
        $brainFiles = @{
            "FMA50801.stl" = "whole_brain.stl"
            "FMA61817.stl" = "cerebrum.stl" 
            "FMA83678.stl" = "cerebellum.stl"
            "FMA79876.stl" = "brainstem.stl"
            "FMA61898.stl" = "frontal_lobe.stl"
            "FMA61889.stl" = "parietal_lobe.stl"
            "FMA61907.stl" = "temporal_lobe.stl"
            "FMA61924.stl" = "occipital_lobe.stl"
        }
        
        $copiedFiles = 0
        foreach ($sourceFile in $brainFiles.Keys) {
            $sourcePath = "$tempDir\assets\stl\$sourceFile"
            $destFile = $brainFiles[$sourceFile]
            $destPath = "$modelsDir\$destFile"
            
            if (Test-Path $sourcePath) {
                Copy-Item -Path $sourcePath -Destination $destPath -Force
                Write-Host "✓ Copied: $destFile" -ForegroundColor Green
                $copiedFiles++
            } else {
                Write-Host "⚠️  Not found: $sourceFile" -ForegroundColor Yellow
            }
        }
        
        Write-Host "✅ Successfully copied $copiedFiles brain model files!" -ForegroundColor Green
        
        # Clean up temporary directory
        Remove-Item -Recurse -Force $tempDir
        Write-Host "🧹 Cleaned up temporary files" -ForegroundColor Gray
        
    } else {
        Write-Host "❌ Failed to find STL files in repository" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error downloading BodyParts3D models: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Manual download instructions:" -ForegroundColor Yellow
    Write-Host "   1. Visit: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D" -ForegroundColor White
    Write-Host "   2. Download the repository ZIP" -ForegroundColor White
    Write-Host "   3. Extract and copy STL files from assets/stl/ to public/models/brain/" -ForegroundColor White
}

# Alternative: Download from Sketchfab (manual instructions)
Write-Host ""
Write-Host "🌐 Alternative: Sketchfab Brain Model (Manual Download)" -ForegroundColor Cyan
Write-Host "   1. Visit: https://sketchfab.com/3d-models/human-brain-e073c2590bc24daaa7323f4daa5b7784" -ForegroundColor White
Write-Host "   2. Click 'Download 3D Model'" -ForegroundColor White
Write-Host "   3. Choose GLTF format" -ForegroundColor White
Write-Host "   4. Save as: public/models/brain/human_brain.gltf" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Green
Write-Host "   1. Restart your development server: npm start" -ForegroundColor White
Write-Host "   2. The app will automatically detect and load the brain models" -ForegroundColor White
Write-Host "   3. Enjoy your anatomically accurate 3D brain visualization!" -ForegroundColor White

Write-Host ""
Write-Host "📄 License Info:" -ForegroundColor Yellow
Write-Host "   BodyParts3D: CC Attribution-Share Alike 2.1 Japan" -ForegroundColor White
Write-Host "   Attribution: 'BodyParts3D, ©2008 Life Science Integrated Database Center'" -ForegroundColor White 