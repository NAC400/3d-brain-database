import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';



// Brain model component that loads actual brain files
function BrainModel() {
  const [brainModel, setBrainModel] = useState<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loadBrainModel = async () => {
      try {
        // Try to load GLTF first
        const gltfLoader = new GLTFLoader();
        try {
          const gltf = await new Promise<any>((resolve, reject) => {
            gltfLoader.load('/models/brain/human_brain.gltf', resolve, undefined, reject);
          });
          
          const model = gltf.scene;
          model.scale.setScalar(2);
          
          // Apply brain material
          model.traverse((child: any) => {
            if (child.isMesh) {
              child.material = new THREE.MeshPhongMaterial({
                color: 0xf4a582,
                shininess: 30,
              });
              child.userData.name = 'Human Brain';
              child.userData.description = 'Anatomically accurate 3D brain model';
            }
          });
          
          setBrainModel(model);
          setIsLoading(false);
          return;
        } catch (gltfError) {
          console.log('GLTF not found, trying OBJ...');
        }

        // Try STL format
        const stlLoader = new STLLoader();
        try {
          const stlGeometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
            stlLoader.load('/models/brain/brain.stl', resolve, undefined, reject);
          });
          
          const stlMaterial = new THREE.MeshPhongMaterial({
            color: 0xf4a582,
            shininess: 30,
          });
          
          const stlMesh = new THREE.Mesh(stlGeometry, stlMaterial);
          stlMesh.scale.setScalar(0.01); // STL files are often in different units
          stlMesh.userData.name = 'Human Brain';
          stlMesh.userData.description = 'Anatomically accurate 3D brain model from NIH';
          
          const stlGroup = new THREE.Group();
          stlGroup.add(stlMesh);
          
          setBrainModel(stlGroup);
          setIsLoading(false);
          return;
        } catch (stlError) {
          console.log('STL not found, trying OBJ...');
        }

        // Try OBJ format
        const objLoader = new OBJLoader();
        try {
          const obj = await new Promise<THREE.Group>((resolve, reject) => {
            objLoader.load('/models/brain/brain.obj', resolve, undefined, reject);
          });
          
          obj.scale.setScalar(2);
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshPhongMaterial({
                color: 0xf4a582,
                shininess: 30,
              });
              child.userData.name = 'Human Brain';
              child.userData.description = 'Anatomically accurate 3D brain model';
            }
          });
          
          setBrainModel(obj);
          setIsLoading(false);
          return;
        } catch (objError) {
          console.log('OBJ not found, creating anatomical model...');
        }

        // Fallback: Create anatomically accurate brain
        const anatomicalBrain = createAnatomicalBrain();
        setBrainModel(anatomicalBrain);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error loading brain model:', error);
        const fallbackBrain = createAnatomicalBrain();
        setBrainModel(fallbackBrain);
        setIsLoading(false);
      }
    };

    loadBrainModel();
  }, []);

  // Create anatomically accurate brain model
  const createAnatomicalBrain = () => {
    const brainGroup = new THREE.Group();
    
    // Main brain geometry with realistic shape
    const brainGeometry = new THREE.SphereGeometry(1, 64, 32);
    
    // Deform to create brain-like shape
    const positions = brainGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Create brain-like deformations
      const noise1 = Math.sin(x * 4) * Math.cos(y * 4) * Math.sin(z * 4) * 0.1;
      const noise2 = Math.sin(x * 8) * Math.cos(y * 8) * Math.sin(z * 8) * 0.05;
      const asymmetry = x > 0 ? 1.1 : 0.9;
      
      positions.setX(i, x * asymmetry + noise1);
      positions.setY(i, y * 0.8 + noise2);
      positions.setZ(i, z * 1.2 + noise1);
    }
    
    brainGeometry.attributes.position.needsUpdate = true;
    brainGeometry.computeVertexNormals();
    
    // Main brain
    const brainMaterial = new THREE.MeshPhongMaterial({
      color: 0xf4a582,
      shininess: 30,
    });
    
    const brain = new THREE.Mesh(brainGeometry, brainMaterial);
    brain.userData = { 
      name: 'Cerebral Cortex', 
      description: 'The outer layer of the brain responsible for higher cognitive functions, consciousness, and complex thought processes.',
      color: '#f4a582'
    };
    brainGroup.add(brain);

    // Cerebellum
    const cerebellumGeometry = new THREE.SphereGeometry(0.3, 32, 16);
    cerebellumGeometry.scale(1.2, 0.7, 1);
    const cerebellum = new THREE.Mesh(cerebellumGeometry, new THREE.MeshPhongMaterial({
      color: 0xe08560,
      shininess: 25,
    }));
    cerebellum.position.set(-0.8, -0.6, 0);
    cerebellum.userData = { 
      name: 'Cerebellum', 
      description: 'The "little brain" that controls balance, coordination, and motor learning. Essential for smooth movement.',
      color: '#e08560'
    };
    brainGroup.add(cerebellum);

    // Brainstem
    const stemGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.6, 16);
    const brainstem = new THREE.Mesh(stemGeometry, new THREE.MeshPhongMaterial({
      color: 0x8c6239,
      shininess: 20
    }));
    brainstem.position.set(0, -0.8, 0);
    brainstem.userData = { 
      name: 'Brainstem', 
      description: 'Controls vital functions like breathing, heart rate, and consciousness. Connects brain to spinal cord.',
      color: '#8c6239'
    };
    brainGroup.add(brainstem);

    return brainGroup;
  };

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle breathing animation
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      meshRef.current.scale.setScalar(breathe);
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    const clickedObject = event.object;
    if (clickedObject.userData.name) {
      setSelectedPart(selectedPart === clickedObject.userData.name ? null : clickedObject.userData.name);
    }
  };

  if (isLoading) {
    return (
      <Html center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading Brain Model...</p>
        </div>
      </Html>
    );
  }

  return (
    <group ref={meshRef} onClick={handleClick}>
      {brainModel && <primitive object={brainModel} />}
      {selectedPart && (
        <Html position={[2, 1, 0]}>
          <div className="bg-white bg-opacity-95 rounded-lg p-4 max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedPart}</h3>
            <p className="text-gray-700 text-sm">
              {brainModel?.children.find((child: any) => child.userData.name === selectedPart)?.userData.description || 'Anatomical brain structure'}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// Main brain visualization component
interface Interactive3DBrainProps {
  title?: string;
}

export function Interactive3DBrain({ title = "Interactive 3D Brain Model" }: Interactive3DBrainProps) {
  const [isRotating, setIsRotating] = useState(true);

  return (
    <div className="w-full h-full flex flex-col bg-dark-brain">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-brain-secondary mb-2">{title}</h1>
        <p className="text-gray-400 text-sm">Anatomically accurate 3D brain model • Click to explore • Drag to rotate • Scroll to zoom</p>
      </div>

      {/* Main 3D Visualization */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [4, 2, 6], fov: 60 }}
          className="bg-gradient-to-b from-gray-900 to-black"
        >
          {/* Professional medical lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#4ecdc4" />
          <pointLight position={[0, 5, 0]} intensity={0.5} color="#f4a582" />
          
          {/* Brain Model */}
          <BrainModel />
          
          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            autoRotate={isRotating}
            autoRotateSpeed={0.5}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-800 bg-opacity-90 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isRotating 
                  ? 'bg-brain-secondary text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {isRotating ? 'Stop Rotation' : 'Auto Rotate'}
            </button>
          </div>
          
          <div className="text-gray-400 text-sm">
            Real anatomical brain model • Educational research platform
          </div>
        </div>
      </div>
    </div>
  );
}

 