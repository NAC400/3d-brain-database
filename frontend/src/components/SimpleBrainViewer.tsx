import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface SimpleBrainSliceProps {
  sliceNumber: number;
}

function SimpleBrainSlice({ sliceNumber }: SimpleBrainSliceProps) {
  // Create a procedural brain-like texture
  const createBrainTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create brain-like pattern
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, `rgba(${120 + sliceNumber % 50}, ${80 + sliceNumber % 30}, ${90 + sliceNumber % 40}, 1)`);
    gradient.addColorStop(0.7, `rgba(${60 + sliceNumber % 30}, ${40 + sliceNumber % 20}, ${50 + sliceNumber % 25}, 0.8)`);
    gradient.addColorStop(1, 'rgba(20, 20, 30, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some "brain structure" details
    ctx.strokeStyle = `rgba(${200 + sliceNumber % 30}, ${180 + sliceNumber % 20}, ${190 + sliceNumber % 25}, 0.5)`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(
        256 + Math.sin(i * Math.PI / 4 + sliceNumber * 0.1) * (100 + i * 10),
        256 + Math.cos(i * Math.PI / 4 + sliceNumber * 0.1) * (100 + i * 10),
        20 + i * 5,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const texture = createBrainTexture();

  return (
    <mesh>
      <planeGeometry args={[8, 6]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

interface SimpleBrainViewerProps {
  title?: string;
}

export function SimpleBrainViewer({ title = "Brain Slice Viewer" }: SimpleBrainViewerProps) {
  const [currentSlice, setCurrentSlice] = useState(1100);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlice(prev => prev + 1);
    }, 300);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div style={{ width: '100%', height: '600px', backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>{title}</h2>
      
      {/* 3D Canvas */}
      <div style={{ width: '100%', height: '400px', border: '2px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
        <Canvas 
          camera={{ position: [0, 0, 15], fov: 50 }}
          style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          
          <SimpleBrainSlice sliceNumber={currentSlice} />
          
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
          />
        </Canvas>
      </div>

      {/* Simple Controls */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={() => setCurrentSlice(prev => prev - 1)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ← Previous
        </button>
        
        <span style={{ 
          padding: '8px 20px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          Slice: {currentSlice}
        </span>
        
        <button 
          onClick={() => setCurrentSlice(prev => prev + 1)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Next →
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: isPlaying ? '#dc3545' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px',
        textAlign: 'center',
        color: '#6c757d'
      }}>
        <strong>Brain Slice Visualization</strong> - Use controls to navigate through procedural brain slices
      </div>
    </div>
  );
} 