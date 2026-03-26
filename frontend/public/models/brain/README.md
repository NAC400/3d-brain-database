# Brain 3D Models

This directory contains 3D brain models for the visualization component.

## Current Models

- **brain.stl** - Anatomically accurate brain model from NIH 3D Print Exchange (81KB)
  - Source: https://3dprint.nih.gov/
  - License: Public Domain (U.S. Government Work)
  - Description: High-quality anatomical brain model suitable for medical education

## Adding More Models

The application supports multiple 3D formats:

1. **GLTF/GLB** (Recommended) - Place as `human_brain.gltf` or `human_brain.glb`
2. **STL** - Place as `brain.stl` (currently loaded)
3. **OBJ** - Place as `brain.obj`

The app will automatically try to load models in this order:
1. GLTF format first (best performance)
2. STL format (currently available)
3. OBJ format
4. Fallback to procedural brain model

## Recommended Sources for Additional Models

- **NIH 3D Print Exchange**: https://3dprint.nih.gov/
- **Sketchfab** (with proper licensing): https://sketchfab.com/
- **BodyParts3D**: https://lifesciencedb.jp/bp3d/
- **Human Reference Atlas**: https://www.humanatlas.io/

## License Requirements

When adding models, ensure proper attribution:
- NIH models: Usually public domain
- Sketchfab models: Check individual licenses (often CC Attribution)
- BodyParts3D: CC Attribution-Share Alike 2.1 Japan license

## Technical Notes

- STL files are automatically scaled by 0.01 (common unit conversion)
- GLTF/GLB files are scaled by 2.0
- OBJ files are scaled by 2.0
- All models get brain-colored material applied automatically 