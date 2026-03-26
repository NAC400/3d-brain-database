# Free 3D Brain Model Download Guide

## Recommended Sources (Free & Legal)

### 1. BodyParts3D - Best Free Option ⭐⭐⭐⭐⭐
**Website**: https://lifesciencedb.jp/bp3d/
**GitHub Mirror**: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D

**Steps to Download:**
1. Visit: https://lifesciencedb.jp/bp3d/?lng=en
2. Navigate to the brain section
3. Look for FMA codes: FMA50801 (Whole Brain), FMA61817 (Cerebrum), etc.
4. Download the STL or OBJ files

**GitHub Alternative (Easier):**
```bash
git clone https://github.com/Kevin-Mattheus-Moerman/BodyParts3D.git
cd BodyParts3D/assets/stl
# Brain files are named with FMA codes
```

**Key Files:**
- `FMA50801.stl` - Complete brain
- `FMA61817.stl` - Cerebrum  
- `FMA83678.stl` - Cerebellum
- `FMA79876.stl` - Brain stem

### 2. Sketchfab Human Brain Model ⭐⭐⭐⭐
**Direct Link**: https://sketchfab.com/3d-models/human-brain-e073c2590bc24daaa7323f4daa5b7784

**Steps:**
1. Visit the link above
2. Click "Download 3D Model" 
3. Choose GLTF or OBJ format
4. Free with CC Attribution license

**Stats**: 45.3k triangles, 22.7k vertices - High quality!

### 3. Human Reference Atlas (NIH) ⭐⭐⭐⭐⭐
**Website**: https://humanatlas.io/
**3D Models**: Look for GLB format brain models
**Quality**: Research-grade, based on Visible Human Project

### 4. University of British Columbia Neuroanatomy ⭐⭐⭐
**Link**: https://www.neuroanatomy.ca/3D/wholebrainPG.html
**Quality**: Educational-grade 3D models

## Installation Instructions

### Option A: Quick Setup (Recommended)
1. Download the Sketchfab brain model (easiest):
   ```bash
   # Create models directory
   mkdir -p public/models/brain
   
   # Download the brain model file (you'll get this from Sketchfab)
   # Place it as: public/models/brain/human_brain.gltf
   ```

2. The app will automatically detect and load the model

### Option B: BodyParts3D Setup (Most Accurate)
1. Clone the BodyParts3D repository:
   ```bash
   git clone https://github.com/Kevin-Mattheus-Moerman/BodyParts3D.git temp_brain
   ```

2. Copy brain files to your project:
   ```bash
   mkdir -p public/models/brain
   cp temp_brain/assets/stl/FMA50801.stl public/models/brain/whole_brain.stl
   cp temp_brain/assets/stl/FMA61817.stl public/models/brain/cerebrum.stl
   cp temp_brain/assets/stl/FMA83678.stl public/models/brain/cerebellum.stl
   rm -rf temp_brain
   ```

## File Formats Supported
- **GLTF/GLB**: Best for web (recommended)
- **STL**: Good quality, widely supported
- **OBJ**: Compatible but larger files

## License Compliance
- **BodyParts3D**: Attribute as "BodyParts3D, ©2008 Life Science Integrated Database Center licensed by CC Attribution-Share Alike 2.1 Japan"
- **Sketchfab**: Follow CC Attribution requirements
- **NIH Models**: Usually public domain

## Troubleshooting
- **File too large?** Use GLTF format or reduce polygon count
- **Loading errors?** Check file path and format compatibility
- **Performance issues?** Consider lower-resolution models for real-time use

## Advanced: Converting Formats
If you need to convert between formats:
```bash
# Install Blender (free)
# Use Blender's import/export for format conversion
# Or use online converters like:
# - https://products.groupdocs.app/conversion/3d
# - https://convertio.co/
```

**Next Step**: Once you have the model file, place it in `public/models/brain/` and the app will load it automatically! 