# 3D Brain Research Platform - Development Guide

## 🧠 Project Overview

This platform is designed to provide researchers with an interactive 3D visualization tool for exploring brain anatomy while storing and accessing neural research data mapped to specific brain structures.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

1. **Clone and setup the project**:
   ```bash
   git clone [repository-url]
   cd 3d-brain-research-platform
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your database
   npm run migrate
   npm run dev
   ```

## 🏗️ Architecture Overview

### Frontend (React + Three.js)
- **React 18** with TypeScript for UI components
- **Three.js + React Three Fiber** for 3D brain visualization
- **Zustand** for state management
- **Tailwind CSS** for styling

### Backend (Node.js + Express)
- **Express.js** REST API
- **Prisma ORM** for database operations
- **PostgreSQL** for data persistence
- **JWT** for authentication

### Database Schema
- **BrainStructure**: Anatomical brain regions and their properties
- **ResearchData**: Research findings mapped to brain structures
- **Annotations**: User annotations and observations
- **Users & Studies**: User management and research study organization

## 🎯 Core Features Implementation

### 1. 3D Brain Visualization

**Location**: `frontend/src/components/BrainScene.tsx`

The main 3D scene uses React Three Fiber to render:
- Interactive brain model with clickable regions
- Multiple viewing layers (skull, vasculature, brain tissue)
- Real-time lighting and material effects
- Smooth camera controls and animations

**Key Components**:
- `BrainModel.tsx` - Main 3D brain geometry and interactions
- `BrainControls.tsx` - UI controls for visualization settings
- `LoadingSpinner.tsx` - Loading states and feedback

### 2. Brain Region Management

**Store**: `frontend/src/store/brainStore.ts`

State management for:
- Selected brain regions
- Layer visibility toggles
- Opacity controls
- View mode switching
- Research data integration

**Sample Regions**: `research-data/sample-brain-regions.json`

### 3. Data Integration

The platform supports multiple types of neural research data:
- **fMRI activation data**
- **DTI connectivity measures**
- **Structural measurements**
- **Behavioral correlations**
- **Temporal data series**

## 🎨 3D Model Integration

### Current Implementation
- Placeholder geometric primitives for different brain regions
- Color-coded structures with hover and selection states
- Animated rotation and interactive highlighting

### Next Steps for Real Models
1. **Source high-quality brain models**:
   - Allen Brain Institute datasets
   - NIH 3D Print Exchange
   - Harvard Whole Brain Atlas
   - Commercial anatomical models

2. **Convert to web-compatible formats**:
   ```bash
   # Example conversion workflow
   blender --background --python convert_to_gltf.py -- input.obj output.gltf
   ```

3. **Optimize for web performance**:
   - Level-of-detail (LOD) implementations
   - Texture compression
   - Progressive loading

## 🔧 Development Workflow

### Adding New Brain Regions

1. **Update the data structure**:
   ```typescript
   // In store/brainStore.ts
   export const NEW_BRAIN_REGION: BrainRegion = {
     id: 'region-id',
     name: 'Region Name',
     anatomicalId: 'ANAT-ID',
     coordinates: [x, y, z],
     description: 'Detailed description'
   };
   ```

2. **Add 3D representation**:
   ```typescript
   // In components/BrainModel.tsx
   const getRegionGeometry = (regionId: string) => {
     switch (regionId) {
       case 'new-region':
         return <customGeometry args={[...]} />;
       // ...
     }
   };
   ```

3. **Update color scheme and interactions**:
   ```typescript
   const getRegionColor = (regionId: string) => {
     switch (regionId) {
       case 'new-region':
         return "#custom-color";
       // ...
     }
   };
   ```

### Adding Research Data Types

1. **Extend the data type enum**:
   ```prisma
   enum DataType {
     ACTIVATION
     CONNECTIVITY
     // Add new type
     NEW_DATA_TYPE
   }
   ```

2. **Update visualization components** to handle new data types
3. **Create data import/export utilities**

### Adding New Visualization Modes

1. **Extend view mode types**:
   ```typescript
   type ViewMode = 'normal' | 'cross-section' | 'layers' | 'annotations' | 'new-mode';
   ```

2. **Implement rendering logic**:
   ```typescript
   // In BrainModel.tsx
   useFrame((state, delta) => {
     if (viewMode === 'new-mode') {
       // Custom rendering logic
     }
   });
   ```

## 📊 Data Sources and APIs

### Recommended Brain Atlases
- **Allen Brain Atlas**: Comprehensive mouse and human brain data
- **Human Connectome Project**: Large-scale connectivity datasets
- **BrainInfo**: Neuroanatomical nomenclature and structure data
- **NeuroVault**: Statistical brain maps from neuroimaging studies

### API Integration Examples

```typescript
// Fetch research data for a specific brain region
const fetchRegionData = async (regionId: string) => {
  const response = await fetch(`/api/brain-structures/${regionId}/research-data`);
  return response.json();
};

// Upload new research findings
const uploadResearchData = async (data: ResearchDataInput) => {
  const response = await fetch('/api/research-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## 🎮 Controls and Interactions

### 3D Navigation
- **Orbit Controls**: Mouse drag to rotate, wheel to zoom
- **Region Selection**: Click on brain structures to highlight
- **Layer Toggles**: Show/hide skull, vasculature, annotations
- **View Modes**: Switch between normal, cross-section, and annotation views

### Keyboard Shortcuts (Planned)
- `R` - Reset view to default position
- `1-9` - Quick select common brain regions
- `L` - Toggle all layers
- `A` - Show all annotations
- `Space` - Pause/resume animations

## 🚧 Next Development Phases

### Phase 2: Enhanced 3D Models (Weeks 3-6)
- [ ] Integrate real anatomical brain models
- [ ] Implement model loading pipeline
- [ ] Add texture and material support
- [ ] Create region segmentation tools

### Phase 3: Advanced Visualizations (Weeks 7-10)
- [ ] Cross-sectional view implementation
- [ ] Multi-layer rendering system
- [ ] Animation timeline for temporal data
- [ ] Heatmap overlays for activation data

### Phase 4: Data Management (Weeks 11-14)
- [ ] Complete backend API implementation
- [ ] User authentication and authorization
- [ ] Research study management interface
- [ ] Data import/export functionality

### Phase 5: Collaboration Features (Weeks 15-18)
- [ ] Real-time annotation sharing
- [ ] Collaborative viewing sessions
- [ ] Version control for research data
- [ ] Export and presentation tools

## 🔍 Testing Strategy

### Unit Tests
- Component rendering and interactions
- State management logic
- API endpoint functionality
- Data transformation utilities

### Integration Tests
- 3D scene rendering and performance
- Database operations and migrations
- User authentication flows
- File upload and processing

### Performance Testing
- 3D model loading and rendering
- Large dataset visualization
- Real-time interaction responsiveness
- Memory usage optimization

## 📝 Contributing Guidelines

1. **Code Style**: Follow TypeScript and React best practices
2. **Commits**: Use conventional commit messages
3. **Testing**: Add tests for new features
4. **Documentation**: Update this guide when adding major features
5. **Performance**: Consider 3D rendering performance in all changes

## 🐛 Known Issues and Limitations

1. **Model Fidelity**: Currently using placeholder geometries
2. **Performance**: Large datasets may affect rendering performance
3. **Browser Support**: Requires WebGL 2.0 support
4. **Data Formats**: Limited to JSON format for research data

## 📚 Resources

### 3D Development
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

### Neuroscience Data
- [Allen Brain Institute](https://alleninstitute.org/)
- [Human Connectome Project](https://www.humanconnectome.org/)
- [NeuroVault](https://neurovault.org/)
- [BrainInfo](https://braininfo.rprc.washington.edu/)

### Database and Backend
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Spatial Extensions](https://postgis.net/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) 