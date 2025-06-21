import React, { useState } from 'react';
import { useBrainStore } from '../store/brainStore';

const BrainControls: React.FC = () => {
  const {
    selectedRegion,
    showVasculature,
    showSkull,
    opacity,
    viewMode,
    brainRegions,
    setSelectedRegion,
    setShowVasculature,
    setShowSkull,
    setOpacity,
    setViewMode
  } = useBrainStore();

  const [isControlsOpen, setIsControlsOpen] = useState(true);

  return (
    <div className="absolute top-4 left-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsControlsOpen(!isControlsOpen)}
        className="mb-4 px-4 py-2 bg-brain-primary text-white rounded-lg neural-glow hover:bg-brain-secondary transition-colors"
      >
        {isControlsOpen ? 'Hide Controls' : 'Show Controls'}
      </button>

      {/* Main Control Panel */}
      {isControlsOpen && (
        <div className="control-panel rounded-xl p-6 w-80 max-h-96 overflow-y-auto">
          <h2 className="text-xl font-bold text-brain-secondary mb-4">Brain Visualization Controls</h2>
          
          {/* View Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              View Mode
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full p-2 bg-dark-brain border border-brain-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brain-secondary"
            >
              <option value="normal">Normal View</option>
              <option value="cross-section">Cross Section</option>
              <option value="layers">Layer View</option>
              <option value="annotations">Annotations</option>
            </select>
          </div>

          {/* Layer Toggles */}
          <div className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold text-brain-secondary">Layers</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="skull-toggle"
                checked={showSkull}
                onChange={(e) => setShowSkull(e.target.checked)}
                className="mr-3 w-4 h-4 text-brain-primary bg-dark-brain border-brain-primary rounded focus:ring-brain-secondary"
              />
              <label htmlFor="skull-toggle" className="text-gray-300">
                Show Skull
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="vasculature-toggle"
                checked={showVasculature}
                onChange={(e) => setShowVasculature(e.target.checked)}
                className="mr-3 w-4 h-4 text-brain-primary bg-dark-brain border-brain-primary rounded focus:ring-brain-secondary"
              />
              <label htmlFor="vasculature-toggle" className="text-gray-300">
                Show Vasculature
              </label>
            </div>
          </div>

          {/* Opacity Control */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-dark-brain rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Brain Regions Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Brain Region
            </label>
            <select
              value={selectedRegion || ''}
              onChange={(e) => setSelectedRegion(e.target.value || null)}
              className="w-full p-2 bg-dark-brain border border-brain-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brain-secondary"
            >
              <option value="">None Selected</option>
              {brainRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Region Info */}
          {selectedRegion && (
            <div className="mb-4 p-4 bg-brain-primary bg-opacity-20 rounded-lg border border-brain-primary">
              <h4 className="font-semibold text-brain-secondary mb-2">
                {brainRegions.find(r => r.id === selectedRegion)?.name}
              </h4>
              <p className="text-sm text-gray-300">
                {brainRegions.find(r => r.id === selectedRegion)?.description}
              </p>
              <div className="mt-2 text-xs text-gray-400">
                ID: {brainRegions.find(r => r.id === selectedRegion)?.anatomicalId}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brain-secondary">Quick Actions</h3>
            
            <button
              onClick={() => {
                setSelectedRegion(null);
                setShowVasculature(false);
                setShowSkull(true);
                setOpacity(1.0);
                setViewMode('normal');
              }}
              className="w-full px-4 py-2 bg-neural-purple text-white rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Reset View
            </button>
            
            <button
              onClick={() => {
                setShowVasculature(true);
                setShowSkull(false);
                setOpacity(0.7);
              }}
              className="w-full px-4 py-2 bg-neural-pink text-white rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Focus on Vasculature
            </button>
            
            <button
              onClick={() => {
                setSelectedRegion('basal-ganglia');
                setViewMode('cross-section');
                setOpacity(0.8);
              }}
              className="w-full px-4 py-2 bg-neural-green text-white rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Highlight Basal Ganglia
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainControls; 