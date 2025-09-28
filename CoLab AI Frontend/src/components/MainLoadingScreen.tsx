import React, { useState, useEffect } from 'react';

const MainLoadingScreen: React.FC<{ isExiting?: boolean }> = ({ isExiting = false }) => {
  const [loadingText, setLoadingText] = useState("Initializing");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animated loading text
    const textStates = [
      "Initializing",
      "Initializing.",
      "Initializing..",
      "Initializing...",
      "Loading your session",
      "Loading your session.",
      "Loading your session..",
      "Loading your session...",
      "Almost ready",
      "Almost ready.",
      "Almost ready..",
      "Almost ready..."
    ];
    
    let textIndex = 0;
    const textInterval = setInterval(() => {
      setLoadingText(textStates[textIndex % textStates.length]);
      textIndex++;
    }, 200);

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  // Complete progress when exiting
  useEffect(() => {
    if (isExiting) {
      setProgress(100);
      setLoadingText("Ready!");
    }
  }, [isExiting]);

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 
                  flex flex-col items-center justify-center z-50 transition-all duration-500 ease-in-out
                  ${isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 
                        animate-pulse"></div>
      </div>
      
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo/Brand Area */}
        <div className="mb-12 transform animate-fade-in">
          <div className="relative">
            <h1 className="text-5xl font-montserrat">
              Co Lab Minds
            </h1>

            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 
                            mx-auto rounded-full"></div>
          </div>
        </div>
        
        {/* Main Loading Animation */}
        <div className="mb-8 relative">
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 
                            animate-spin-slow"></div>
            {/* Inner ring */}
            <div className="absolute inset-2 rounded-full border-4 border-purple-300 
                            animate-spin-reverse"></div>
            {/* Center dot */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-r 
                            from-blue-500 to-purple-500 animate-pulse"></div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full 
                           transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {Math.round(Math.min(progress, 100))}%
            </div>
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700 min-h-[1.75rem] 
                        transition-all duration-200">
            {loadingText}
          </p>
          <p className="text-sm text-gray-500">
            Please wait while we prepare everything for you
          </p>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-200 rounded-full 
                        opacity-60 animate-float"></div>
        <div className="absolute -bottom-10 -right-10 w-16 h-16 bg-purple-200 rounded-full 
                        opacity-60 animate-float-delayed"></div>
      </div>
    </div>
  );
};

export default MainLoadingScreen;