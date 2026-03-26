@echo off
echo Setting up 3D Brain Models directory structure...

REM Create main directories
md "models" 2>nul
md "textures" 2>nul
md "materials" 2>nul
md "metadata" 2>nul

REM Create model subdirectories
md "models\brain" 2>nul
md "models\brain\high-res" 2>nul
md "models\brain\segmented" 2>nul
md "models\brain\optimized" 2>nul

md "models\skull" 2>nul
md "models\skull\complete" 2>nul
md "models\skull\sections" 2>nul
md "models\skull\materials" 2>nul

md "models\vasculature" 2>nul
md "models\vasculature\cerebral" 2>nul
md "models\vasculature\arterial" 2>nul
md "models\vasculature\venous" 2>nul

md "models\combined" 2>nul
md "models\combined\brain-skull" 2>nul
md "models\combined\brain-vasculature" 2>nul
md "models\combined\complete-head" 2>nul

REM Create texture subdirectories
md "textures\brain" 2>nul
md "textures\bone" 2>nul
md "textures\vessels" 2>nul

REM Create materials subdirectories
md "materials\brain-shaders" 2>nul
md "materials\bone-shaders" 2>nul
md "materials\vessel-shaders" 2>nul

echo Directory structure created successfully!
echo Run this script from the assets folder to set up your 3D model organization.
pause 