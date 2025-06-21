import React, { useEffect } from 'react';
import BrainScene from './components/BrainScene';
import { useBrainStore } from './store/brainStore';
import './App.css';

const App: React.FC = () => {
  const { setLoading } = useBrainStore();

  useEffect(() => {
    // Simulate initial loading
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLoading]);

  return (
    <div className="App h-screen w-screen bg-dark-brain overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 right-0 z-50 p-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-brain-secondary">
            3D Brain Research Platform
          </h1>
          <p className="text-sm text-gray-400">
            Interactive Neural Data Visualization
          </p>
        </div>
      </header>

      {/* Main 3D Scene */}
      <main className="w-full h-full">
        <BrainScene />
      </main>

      {/* Info Panel */}
      <div className="absolute bottom-4 right-4 z-40">
        <div className="control-panel rounded-lg p-4 max-w-sm">
          <h3 className="text-sm font-semibold text-brain-secondary mb-2">
            Navigation Help
          </h3>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• <strong>Left Click + Drag:</strong> Rotate view</li>
            <li>• <strong>Mouse Wheel:</strong> Zoom in/out</li>
            <li>• <strong>Right Click + Drag:</strong> Pan view</li>
            <li>• <strong>Click Brain Region:</strong> Select and highlight</li>
          </ul>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="bg-dark-brain bg-opacity-80 backdrop-blur-sm border-t border-brain-primary px-4 py-2">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Ready for neural research visualization</span>
            <span>Version 1.0.0 Beta</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
