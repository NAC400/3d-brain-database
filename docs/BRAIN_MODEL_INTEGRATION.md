# Brain Model Integration Guide

## 🧠 Phase 2: Real Brain Model Integration

### **Option A: Quick Start with Free Models (Recommended)**

#### **1. Allen Brain Institute - Human Reference Atlas**
```bash
# Download links (these are the actual files from Allen Institute):
# Human Brain Annotation Volume:
wget http://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/examples/convert_to_itksnap/annotation.nii.gz

# Human Brain Template:
wget http://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/examples/convert_to_itksnap/template.nii.gz
```

#### **2. Convert to Web-Compatible Format**

**Method 1: Using ITK-SNAP (Free tool)**
1. Download and install ITK-SNAP
2. Load the annotation file as main image
3. Load segmentation file 
4. Export as STL/OBJ files
5. Convert STL/OBJ to GLTF using Blender

**Method 2: Online Converters**
- Use online STL to GLTF converters
- Or Blender's export functionality

#### **3. Integration Code Example**

```typescript
// src/components/RealBrainModel.tsx
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const RealBrainModel: React.FC = () => {
  const gltf = useLoader(GLTFLoader, '/models/brain.gltf');
  
  return (
    <primitive object={gltf.scene} scale={[1, 1, 1]} />
  );
};
```

### **Option B: Ready-Made Models (Faster)**

#### **1. SketchFab/Free3D Brain Models**
- Search for "brain anatomy 3d model"
- Download in GLTF format
- Drop into your public/models folder

#### **2. Immediate Testing Models**
```javascript
// Temporary placeholder until real model
const BrainModelLoader = () => {
  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial 
        color="#ff6b9d" 
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
};
```

### **Phase 2.1: Model Integration (This Week)**

**Day 1-2: Source Model**
- [ ] Download Allen Brain Atlas data
- [ ] Convert to GLTF format
- [ ] Test loading in Blender

**Day 3-4: Integration**
- [ ] Add GLTFLoader to React app
- [ ] Replace placeholder geometry
- [ ] Maintain interactive regions

**Day 5: Polish**
- [ ] Optimize model size/performance
- [ ] Add loading states
- [ ] Test interactions

### **Code Structure for Real Models**

```typescript
// src/components/BrainModel.tsx (Updated)
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useState, useRef } from 'react';

const BrainModel: React.FC<BrainModelProps> = ({ selectedRegion, opacity }) => {
  const gltf = useLoader(GLTFLoader, '/models/allen-brain.gltf');
  const modelRef = useRef();

  // Clone the model to allow independent materials per region
  const brain = useMemo(() => gltf.scene.clone(), [gltf]);

  useEffect(() => {
    // Apply materials and region highlighting
    brain.traverse((child) => {
      if (child.isMesh) {
        // Map child names to brain regions
        const regionId = mapMeshToRegion(child.name);
        child.material = createRegionMaterial(regionId, selectedRegion);
        child.userData = { regionId };
      }
    });
  }, [brain, selectedRegion]);

  return <primitive ref={modelRef} object={brain} scale={[1, 1, 1]} />;
};

// Helper functions
const mapMeshToRegion = (meshName: string): string => {
  const mappings = {
    'cortex': 'cortex',
    'hippocampus_L': 'hippocampus-left',
    'hippocampus_R': 'hippocampus-right',
    'basal_ganglia': 'basal-ganglia',
    // ... more mappings
  };
  return mappings[meshName] || 'unknown';
};

const createRegionMaterial = (regionId: string, selectedRegion: string) => {
  const isSelected = regionId === selectedRegion;
  return new MeshStandardMaterial({
    color: getRegionColor(regionId, isSelected),
    transparent: true,
    opacity: isSelected ? 1.0 : 0.8,
    emissive: isSelected ? '#10b981' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  });
};
```

### **Performance Optimization**

```typescript
// Level of Detail (LOD) for performance
import { LOD } from 'three';

const OptimizedBrainModel = () => {
  const [highRes, medRes, lowRes] = useLoader(GLTFLoader, [
    '/models/brain-high.gltf',
    '/models/brain-med.gltf', 
    '/models/brain-low.gltf'
  ]);

  return (
    <lod>
      <primitive object={highRes.scene} distance={0} />
      <primitive object={medRes.scene} distance={10} />
      <primitive object={lowRes.scene} distance={25} />
    </lod>
  );
};
```

### **File Structure**
```
public/
  models/
    brain/
      main-brain.gltf
      cortex.gltf
      basal-ganglia.gltf
      hippocampus.gltf
      textures/
        brain-diffuse.jpg
        brain-normal.jpg
```

### **Next Steps After Model Integration**

1. **Regional Segmentation**: Map model parts to anatomical regions
2. **Texture Enhancement**: Add realistic brain textures
3. **Animation System**: Smooth transitions between view modes
4. **Data Overlays**: Research data visualization on the model
5. **Cross-sections**: Implement slice views

### **Resources & Links**

- **Allen Brain Institute Downloads**: http://download.alleninstitute.org/
- **ITK-SNAP (Free)**: http://www.itksnap.org/
- **Blender (Free)**: https://www.blender.org/
- **GLTF Validator**: https://github.khronos.org/glTF-Validator/
- **Model Optimization**: https://gltf.report/ 