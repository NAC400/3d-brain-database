// NIH Visible Human Project - React/Three.js Integration Helper
// This file provides utilities to load and display Visible Human data

import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

/**
 * Visible Human Data Loader Class
 * Handles loading and processing of NIH Visible Human Project data
 */
export class VisibleHumanLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.loadedSlices = new Map();
    this.datasets = {
      male: {
        path: '/assets/models/brain/visible-human-male/',
        totalSlices: 1871,
        resolution: { x: 2048, y: 1216 },
        spacing: { x: 0.33, y: 0.33, z: 1.0 } // mm
      },
      female: {
        path: '/assets/models/brain/visible-human-female/',
        totalSlices: 5189,
        resolution: { x: 2048, y: 1216 },
        spacing: { x: 0.33, y: 0.33, z: 0.33 } // mm
      }
    };
  }

  /**
   * Load a specific slice from the dataset
   * @param {string} dataset - 'male' or 'female'
   * @param {number} sliceIndex - Index of the slice to load
   * @returns {Promise<THREE.Texture>}
   */
  async loadSlice(dataset, sliceIndex) {
    const config = this.datasets[dataset];
    if (!config) {
      throw new Error(`Unknown dataset: ${dataset}`);
    }

    const sliceKey = `${dataset}_${sliceIndex}`;
    
    // Return cached slice if already loaded
    if (this.loadedSlices.has(sliceKey)) {
      return this.loadedSlices.get(sliceKey);
    }

    // Format slice number with leading zeros (e.g., 0001, 0002, etc.)
    const paddedIndex = sliceIndex.toString().padStart(4, '0');
    const filename = `${dataset}_${paddedIndex}.png`;
    const fullPath = `${config.path}${filename}`;

    try {
      const texture = await this.loadTexture(fullPath);
      texture.format = THREE.RGBFormat;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      // Cache the loaded texture
      this.loadedSlices.set(sliceKey, texture);
      
      return texture;
    } catch (error) {
      console.error(`Failed to load slice ${sliceIndex} from ${dataset} dataset:`, error);
      throw error;
    }
  }

  /**
   * Load a range of slices for volume rendering
   * @param {string} dataset - 'male' or 'female'
   * @param {number} startSlice - Starting slice index
   * @param {number} endSlice - Ending slice index
   * @returns {Promise<THREE.Texture[]>}
   */
  async loadSliceRange(dataset, startSlice, endSlice) {
    const promises = [];
    
    for (let i = startSlice; i <= endSlice; i++) {
      promises.push(this.loadSlice(dataset, i));
    }
    
    return Promise.all(promises);
  }

  /**
   * Create a 3D volume from slice data
   * @param {string} dataset - 'male' or 'female'
   * @param {number} startSlice - Starting slice
   * @param {number} count - Number of slices to include
   * @returns {Promise<THREE.Mesh>}
   */
  async createVolumeVisualization(dataset, startSlice = 1, count = 100) {
    const config = this.datasets[dataset];
    const endSlice = Math.min(startSlice + count - 1, config.totalSlices);
    
    console.log(`Creating volume visualization for ${dataset} dataset (slices ${startSlice}-${endSlice})`);
    
    try {
      const slices = await this.loadSliceRange(dataset, startSlice, endSlice);
      
      // Create geometry for volume rendering
      const geometry = new THREE.BoxGeometry(
        config.resolution.x * config.spacing.x / 1000, // Convert to meters
        config.resolution.y * config.spacing.y / 1000,
        count * config.spacing.z / 1000
      );
      
      // Create material with the first slice as texture
      const material = new THREE.MeshBasicMaterial({
        map: slices[0],
        transparent: true,
        opacity: 0.8
      });
      
      const volumeMesh = new THREE.Mesh(geometry, material);
      
      // Store slice data for animation/interaction
      volumeMesh.userData = {
        slices: slices,
        currentSlice: 0,
        dataset: dataset,
        config: config
      };
      
      return volumeMesh;
    } catch (error) {
      console.error('Failed to create volume visualization:', error);
      throw error;
    }
  }

  /**
   * Load texture with Promise wrapper
   * @param {string} path - Path to texture file
   * @returns {Promise<THREE.Texture>}
   */
  loadTexture(path) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => resolve(texture),
        (progress) => console.log(`Loading texture: ${Math.round(progress.loaded / progress.total * 100)}%`),
        (error) => reject(error)
      );
    });
  }

  /**
   * Get dataset information
   * @param {string} dataset - 'male' or 'female'
   * @returns {Object}
   */
  getDatasetInfo(dataset) {
    return this.datasets[dataset];
  }

  /**
   * Clear cached slices to free memory
   */
  clearCache() {
    this.loadedSlices.forEach(texture => {
      texture.dispose();
    });
    this.loadedSlices.clear();
  }
}

/**
 * React Component for Visible Human Brain Visualization
 */
export function VisibleHumanBrain({ 
  dataset = 'male', 
  startSlice = 800, 
  sliceCount = 50,
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}) {
  const [volumeMesh, setVolumeMesh] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [currentSlice, setCurrentSlice] = React.useState(0);
  
  const loaderRef = React.useRef(new VisibleHumanLoader());
  
  React.useEffect(() => {
    const loadVolume = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const mesh = await loaderRef.current.createVolumeVisualization(
          dataset, 
          startSlice, 
          sliceCount
        );
        
        setVolumeMesh(mesh);
      } catch (err) {
        setError(err.message);
        console.error('Error loading Visible Human data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadVolume();
    
    // Cleanup on unmount
    return () => {
      loaderRef.current.clearCache();
    };
  }, [dataset, startSlice, sliceCount]);

  // Handle slice animation
  React.useEffect(() => {
    if (!volumeMesh) return;
    
    const slices = volumeMesh.userData.slices;
    if (slices && slices[currentSlice]) {
      volumeMesh.material.map = slices[currentSlice];
      volumeMesh.material.needsUpdate = true;
    }
  }, [volumeMesh, currentSlice]);

  if (loading) {
    return (
      <mesh position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="gray" transparent opacity={0.3} />
      </mesh>
    );
  }

  if (error) {
    console.error('VisibleHumanBrain error:', error);
    return (
      <mesh position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" transparent opacity={0.3} />
      </mesh>
    );
  }

  if (!volumeMesh) return null;

  return (
    <primitive 
      object={volumeMesh} 
      position={position} 
      rotation={rotation}
    />
  );
}

/**
 * Slice Navigator Component
 * Provides controls for navigating through brain slices
 */
export function SliceNavigator({ 
  onSliceChange, 
  currentSlice, 
  totalSlices, 
  dataset = 'male' 
}) {
  return (
    <div className="slice-navigator" style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Dataset:</strong> {dataset.toUpperCase()} | 
        <strong> Slice:</strong> {currentSlice + 1} / {totalSlices}
      </div>
      
      <input
        type="range"
        min="0"
        max={totalSlices - 1}
        value={currentSlice}
        onChange={(e) => onSliceChange(parseInt(e.target.value))}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => onSliceChange(Math.max(0, currentSlice - 1))}
          disabled={currentSlice === 0}
          style={{
            padding: '5px 15px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Previous
        </button>
        
        <button 
          onClick={() => onSliceChange(Math.min(totalSlices - 1, currentSlice + 1))}
          disabled={currentSlice === totalSlices - 1}
          style={{
            padding: '5px 15px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * Example usage in your main React component:
 * 
 * import { VisibleHumanBrain, SliceNavigator } from './assets/integrate_visible_human.js';
 * 
 * function BrainViewer() {
 *   const [currentSlice, setCurrentSlice] = useState(0);
 *   
 *   return (
 *     <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
 *       <Canvas>
 *         <ambientLight intensity={0.5} />
 *         <pointLight position={[10, 10, 10]} />
 *         <VisibleHumanBrain 
 *           dataset="male"
 *           startSlice={800}
 *           sliceCount={100}
 *           position={[0, 0, 0]}
 *         />
 *         <OrbitControls />
 *       </Canvas>
 *       
 *       <SliceNavigator
 *         currentSlice={currentSlice}
 *         totalSlices={100}
 *         onSliceChange={setCurrentSlice}
 *         dataset="male"
 *       />
 *     </div>
 *   );
 * }
 */

export default VisibleHumanLoader; 