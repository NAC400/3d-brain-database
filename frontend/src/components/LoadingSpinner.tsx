import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading Brain Model...", 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated Brain Icon */}
      <div className="relative mb-4">
        <div className={`${sizeClasses[size]} brain-loader`}></div>
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-neural-green animate-pulse`}></div>
      </div>
      
      {/* Loading Message */}
      <div className="text-center">
        <p className="text-brain-secondary font-medium mb-2">{message}</p>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-brain-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-brain-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-brain-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 