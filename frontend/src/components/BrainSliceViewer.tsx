import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

interface BrainSliceProps {
  sliceNumber: number;
  opacity?: number;
  position?: [number, number, number];
}

// Brain slice component that renders a single slice
function BrainSlice({ sliceNumber, opacity = 1, position = [0, 0, 0] }: BrainSliceProps) {
  // Always use fallback texture for now - we'll create a separate component for real textures later
  const useFallback = true;

  // Fallback: create a procedural brain-like texture
  const createFallbackTexture = (): THREE.CanvasTexture => {
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
    
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.needsUpdate = true;
    return fallbackTexture;
  };

  const displayTexture = useFallback ? createFallbackTexture() : createFallbackTexture();

  return (
    <mesh position={position}>
      <planeGeometry args={[8, 6]} />
      <meshBasicMaterial 
        map={displayTexture} 
        transparent 
        opacity={opacity}
        side={THREE.DoubleSide}
      />
      {useFallback && (
        <Html position={[0, -3.5, 0]}>
          <div style={{ 
            color: 'orange', 
            fontSize: '12px', 
            textAlign: 'center',
            background: 'rgba(0,0,0,0.7)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            Using placeholder data for slice {sliceNumber}
          </div>
        </Html>
      )}
    </mesh>
  );
}

interface BrainSliceViewerProps {
  initialSlice?: number;
  minSlice?: number;
  maxSlice?: number;
  title?: string;
}

// Main Brain Slice Viewer Component
export function BrainSliceViewer({ 
  initialSlice = 1100, 
  minSlice = 1000, 
  maxSlice = 1400,
  title = "Brain Slice Viewer" 
}: BrainSliceViewerProps) {
  const [currentSlice, setCurrentSlice] = useState(initialSlice);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(200);
  const [showMultiple, setShowMultiple] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlice(prev => {
        const next = prev + 1;
        return next > maxSlice ? minSlice : next;
      });
    }, playSpeed);
    
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, minSlice, maxSlice]);

  const handleSliceChange = (delta: number) => {
    setCurrentSlice(prev => {
      const next = prev + delta;
      if (next < minSlice) return maxSlice;
      if (next > maxSlice) return minSlice;
      return next;
    });
  };

  return (
    <div className="brain-slice-viewer" style={{ width: '100%', height: '600px', position: 'relative' }}>
      <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>{title}</h2>
      
      {/* 3D Canvas */}
      <div style={{ width: '100%', height: '500px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <Canvas 
          camera={{ position: [0, 0, 15], fov: 50 }}
          style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4a90e2" />
          
          <Suspense fallback={
            <Html center>
              <div style={{ color: 'white', fontSize: '18px' }}>Loading brain data...</div>
            </Html>
          }>
            {showMultiple ? (
              // Show multiple slices for 3D effect
              [...Array(5)].map((_, i) => (
                <BrainSlice 
                  key={currentSlice + i}
                  sliceNumber={currentSlice + i * 2}
                  opacity={1 - i * 0.15}
                  position={[0, 0, -i * 0.5]}
                />
              ))
            ) : (
              // Show single slice
              <BrainSlice sliceNumber={currentSlice} />
            )}
          </Suspense>
          
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={30}
          />
        </Canvas>
      </div>

      {/* Controls */}
      <div style={{ 
        marginTop: '10px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        {/* Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => handleSliceChange(-10)}
            style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ⏮️ -10
          </button>
          <button 
            onClick={() => handleSliceChange(-1)}
            style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ⏪ -1
          </button>
          
          <span style={{ 
            padding: '8px 15px', 
            background: '#28a745', 
            color: 'white', 
            borderRadius: '4px',
            fontWeight: 'bold',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            Slice: {currentSlice}
          </span>
          
          <button 
            onClick={() => handleSliceChange(1)}
            style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            +1 ⏩
          </button>
          <button 
            onClick={() => handleSliceChange(10)}
            style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            +10 ⏭️
          </button>
        </div>
        
        {/* Auto-play Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ 
              padding: '8px 12px', 
              background: isPlaying ? '#dc3545' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Speed:
            <select 
              value={playSpeed} 
              onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value={50}>Very Fast</option>
              <option value={100}>Fast</option>
              <option value={200}>Normal</option>
              <option value={500}>Slow</option>
              <option value={1000}>Very Slow</option>
            </select>
          </label>
        </div>
        
        {/* View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input 
              type="checkbox" 
              checked={showMultiple}
              onChange={(e) => setShowMultiple(e.target.checked)}
            />
            3D Layer View
          </label>
        </div>
        
        {/* Slice Range Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <label>Slice Range:</label>
          <input 
            type="range" 
            min={minSlice} 
            max={maxSlice} 
            value={currentSlice}
            onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
            style={{ width: '150px' }}
          />
        </div>
      </div>
      
      {/* Instructions */}
      <div style={{ 
        marginTop: '10px', 
        padding: '10px', 
        background: '#e9ecef', 
        borderRadius: '4px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <strong>Instructions:</strong> Use the controls above to navigate through brain slices. 
        Camera controls: Click and drag to rotate, scroll to zoom, right-click and drag to pan.
        Currently showing placeholder data - add NIH Visible Human PNG files to see real brain slices.
      </div>
    </div>
  );
} 