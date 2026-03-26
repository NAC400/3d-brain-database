import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

// Real brain model component
function BrainModel({ onBrainLoad }: { onBrainLoad: (loaded: boolean) => void }) {
  const brainRef = useRef<THREE.Group>(null);
  const [brainLoaded, setBrainLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to load brain model from multiple sources
  useEffect(() => {
    const loadRealBrainModel = async () => {
      try {
        // Try loading real brain models in order of preference
        const modelPaths = [
          '/models/brain/human_brain.gltf',  // Sketchfab model
          '/models/brain/whole_brain.stl',   // BodyParts3D model
          '/models/brain/brain.obj',         // Generic OBJ model
          '/models/brain/brain.glb'          // GLB format
        ];

        for (const path of modelPaths) {
          try {
            let model;
            
            if (path.endsWith('.gltf') || path.endsWith('.glb')) {
              const gltfLoader = new GLTFLoader();
              const result = await new Promise<any>((resolve, reject) => {
                gltfLoader.load(path, resolve, undefined, reject);
              });
              model = result.scene;
            } else if (path.endsWith('.obj')) {
              const objLoader = new OBJLoader();
              model = await new Promise<any>((resolve, reject) => {
                objLoader.load(path, resolve, undefined, reject);
              });
            }

            if (model && brainRef.current) {
              // Scale and position the real brain model
              model.scale.setScalar(2);
              model.position.set(0, 0, 0);
              
              // Apply brain material to all meshes
              const brainMaterial = new THREE.MeshPhongMaterial({
                color: 0xf4a582,
                shininess: 30,
                transparent: true,
                opacity: 0.95
              });

              model.traverse((child: any) => {
                if (child.isMesh) {
                  child.material = brainMaterial;
                  child.userData = { 
                    name: 'Human Brain', 
                    description: 'Anatomically accurate 3D brain model from medical imaging data' 
                  };
                }
              });

              brainRef.current.clear();
              brainRef.current.add(model);
              setBrainLoaded(true);
              onBrainLoad(true);
              console.log(`Successfully loaded brain model: ${path}`);
              return; // Success - exit the loop
            }
          } catch (error) {
            console.warn(`Failed to load brain model from ${path}:`, error);
            continue; // Try next model
          }
        }
        
        // If no real models found, create fallback anatomical model
        throw new Error('No real brain models found, using fallback');
        
      } catch (error) {
                 console.log('Loading fallback anatomically-inspired brain model...');
         const anatomicalModel = createRealisticBrain();
        if (brainRef.current) {
          brainRef.current.clear();
          brainRef.current.add(anatomicalModel);
          setBrainLoaded(true);
          onBrainLoad(true);
        }
      }
    };

    loadRealBrainModel();
    
    // Create procedural brain model with realistic anatomy
    const createRealisticBrain = () => {
      const brainGroup = new THREE.Group();
      
      // Brain tissue material
      const brainMaterial = new THREE.MeshPhongMaterial({
        color: 0xf4a582,
        shininess: 30,
        transparent: true,
        opacity: 0.95
      });

      // Gray matter material
      const grayMaterial = new THREE.MeshPhongMaterial({
        color: 0x8c6239,
        shininess: 20
      });

      // White matter material
      const whiteMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 40,
        transparent: true,
        opacity: 0.7
      });

      // Create realistic brain geometry
      const brainShape = new THREE.Shape();
      // Brain outline (sagittal view inspired)
      brainShape.moveTo(-1.5, -1);
      brainShape.bezierCurveTo(-1.8, -0.5, -1.8, 0.5, -1.5, 1);
      brainShape.bezierCurveTo(-1, 1.3, 0, 1.4, 1, 1.2);
      brainShape.bezierCurveTo(1.8, 0.8, 2, 0, 1.8, -0.8);
      brainShape.bezierCurveTo(1.5, -1.2, 0.5, -1.3, -1.5, -1);

      const extrudeSettings = {
        depth: 1.5,
        bevelEnabled: true,
        bevelSegments: 8,
        steps: 2,
        bevelSize: 0.1,
        bevelThickness: 0.1
      };

      // Main brain structure
      const brainGeometry = new THREE.ExtrudeGeometry(brainShape, extrudeSettings);
      const brain = new THREE.Mesh(brainGeometry, brainMaterial);
      brain.scale.set(0.8, 0.8, 0.8);
      brain.userData = { name: 'Cerebrum', description: 'Main brain structure responsible for higher cognitive functions' };
      brainGroup.add(brain);

      // Cerebellum
      const cerebellumGeometry = new THREE.SphereGeometry(0.4, 16, 12);
      cerebellumGeometry.scale(1, 0.7, 1.2);
      const cerebellum = new THREE.Mesh(cerebellumGeometry, brainMaterial);
      cerebellum.position.set(-0.8, -0.8, 0);
      cerebellum.userData = { name: 'Cerebellum', description: 'Controls balance, coordination, and motor learning' };
      brainGroup.add(cerebellum);

      // Brain stem
      const stemGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
      const brainstem = new THREE.Mesh(stemGeometry, grayMaterial);
      brainstem.position.set(0, -1, 0);
      brainstem.userData = { name: 'Brainstem', description: 'Controls vital functions like breathing and heart rate' };
      brainGroup.add(brainstem);

      // Frontal lobe detail
      const frontalGeometry = new THREE.SphereGeometry(0.6, 12, 8);
      frontalGeometry.scale(1.2, 0.8, 0.9);
      const frontalLobe = new THREE.Mesh(frontalGeometry, new THREE.MeshPhongMaterial({
        color: 0xe08560,
        transparent: true,
        opacity: 0.8
      }));
      frontalLobe.position.set(0.8, 0.3, 0);
      frontalLobe.userData = { name: 'Frontal Lobe', description: 'Executive functions, personality, motor control' };
      brainGroup.add(frontalLobe);

      // Parietal lobe
      const parietalGeometry = new THREE.SphereGeometry(0.5, 12, 8);
      const parietalLobe = new THREE.Mesh(parietalGeometry, new THREE.MeshPhongMaterial({
        color: 0xd97350,
        transparent: true,
        opacity: 0.8
      }));
      parietalLobe.position.set(-0.2, 0.7, 0);
      parietalLobe.userData = { name: 'Parietal Lobe', description: 'Sensory processing and spatial awareness' };
      brainGroup.add(parietalLobe);

      // Temporal lobe
      const temporalGeometry = new THREE.SphereGeometry(0.4, 12, 8);
      temporalGeometry.scale(0.8, 1.2, 0.9);
      const temporalLobe = new THREE.Mesh(temporalGeometry, new THREE.MeshPhongMaterial({
        color: 0xcc6640,
        transparent: true,
        opacity: 0.8
      }));
      temporalLobe.position.set(0.2, -0.3, 0.6);
      temporalLobe.userData = { name: 'Temporal Lobe', description: 'Auditory processing and memory formation' };
      brainGroup.add(temporalLobe);

      // Occipital lobe
      const occipitalGeometry = new THREE.SphereGeometry(0.35, 12, 8);
      const occipitalLobe = new THREE.Mesh(occipitalGeometry, new THREE.MeshPhongMaterial({
        color: 0xb85530,
        transparent: true,
        opacity: 0.8
      }));
      occipitalLobe.position.set(-1.2, 0, 0);
      occipitalLobe.userData = { name: 'Occipital Lobe', description: 'Primary visual processing center' };
      brainGroup.add(occipitalLobe);

      // Add surface texture details
      const surfaceDetail = new THREE.Group();
      for (let i = 0; i < 30; i++) {
        const gyrusGeometry = new THREE.CylinderGeometry(0.02, 0.02, Math.random() * 0.3 + 0.1, 4);
        const gyrus = new THREE.Mesh(gyrusGeometry, new THREE.MeshPhongMaterial({
          color: 0xa04020,
          transparent: true,
          opacity: 0.6
        }));
        
        // Random positioning on brain surface
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const radius = 1.1;
        
        gyrus.position.set(
          radius * Math.sin(theta) * Math.cos(phi) * 0.8,
          radius * Math.cos(theta) * 0.6,
          radius * Math.sin(theta) * Math.sin(phi) * 0.7
        );
        gyrus.rotation.set(Math.random(), Math.random(), Math.random());
        surfaceDetail.add(gyrus);
      }
      brainGroup.add(surfaceDetail);

      brainGroup.scale.set(1.5, 1.5, 1.5);
      brainGroup.position.set(0, 0, 0);

      return brainGroup;
    };

    try {
      const realisticBrain = createRealisticBrain();
      if (brainRef.current) {
        brainRef.current.clear();
        brainRef.current.add(realisticBrain);
        setBrainLoaded(true);
        onBrainLoad(true);
      }
    } catch (err) {
      console.error('Error creating brain model:', err);
      setError('Failed to create brain model');
      onBrainLoad(false);
    }
  }, [onBrainLoad]);

  useFrame((state) => {
    if (brainRef.current && brainLoaded) {
      // Gentle rotation
      brainRef.current.rotation.y += 0.002;
      
      // Subtle breathing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      brainRef.current.scale.setScalar(scale * 1.5);
    }
  });

  if (error) {
    return (
      <Html center>
        <div style={{ 
          background: '#ff4444', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      </Html>
    );
  }

  return <group ref={brainRef} />;
}

// Loading indicator
function LoadingIndicator() {
  return (
    <Html center>
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        color: '#3b82f6',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Loading Anatomical Brain Model...
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          color: '#9ca3af'
        }}>
          Building detailed neural structures
        </div>
      </div>
    </Html>
  );
}

// Main component
interface RealBrainViewerProps {
  title?: string;
}

export default function RealBrainViewer({ title = "Anatomical Brain Model" }: RealBrainViewerProps) {
  const [brainLoaded, setBrainLoaded] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);

  const handleBrainClick = (event: any) => {
    if (event.object && event.object.userData && event.object.userData.name) {
      setSelectedStructure(event.object.userData);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [3, 2, 5], fov: 60 }}
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Lighting setup for medical visualization */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#60a5fa" />
        
        {/* Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxDistance={10}
          minDistance={2}
        />

        {/* Brain model */}
        <group onClick={handleBrainClick}>
          <BrainModel onBrainLoad={setBrainLoaded} />
        </group>

        {/* Loading indicator */}
        {!brainLoaded && <LoadingIndicator />}
      </Canvas>

      {/* Information panel */}
      {selectedStructure && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          maxWidth: '300px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>
            {selectedStructure.name}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
            {selectedStructure.description}
          </p>
          <button
            onClick={() => setSelectedStructure(null)}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.6)',
        color: '#9ca3af',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <div>🖱️ Click structures to learn about them</div>
        <div>🔄 Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  );
}