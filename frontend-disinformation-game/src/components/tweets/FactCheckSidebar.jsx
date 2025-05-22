import React, { useState, useEffect } from "react";
import MessageCard from "./MessageCard";
import { FactCheckPanel } from "../game/GamePanels";

function FactCheckSidebar({ 
  isOpen, 
  message, 
  onClose, 
  onModerate, 
  factCheckResult, 
  loading, 
  factChecksRemaining 
}) {
  const [animationClass, setAnimationClass] = useState("translate-x-full");

  useEffect(() => {
    if (isOpen) {
      // Small delay for animation to work properly
      const timer = setTimeout(() => {
        setAnimationClass("translate-x-0");
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnimationClass("translate-x-full");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 z-40 h-full w-full md:w-2/5 lg:w-1/3">
      <div 
        className={`absolute inset-y-0 right-0 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out ${animationClass}`}
      >
        {/* Header with close button */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 p-4 backdrop-blur">
          <h2 className="text-xl font-bold text-gray-800">Tweet Analysis</h2>
          <button 
            onClick={onClose} 
            className="rounded-full bg-gray-200 p-2 hover:bg-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <div className="mb-6">
            <MessageCard 
              message={message} 
              onModerate={onModerate} 
              onClose={onClose} 
              clickable={false}
            />
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <FactCheckPanel 
              factCheckResult={factCheckResult} 
              loading={loading} 
              factChecksRemaining={factChecksRemaining} 
              handleModeration={onModerate} 
              currentMessageId={message?.id} 
              largerArticles={true} 
            />
          </div>
        </div>
      </div>
      
      {/* Semi-transparent overlay to catch clicks outside */}
      <div 
        className="fixed inset-0 bg-black/50 z-[-1]" 
        onClick={onClose}
      ></div>
    </div>
  );
}

export default FactCheckSidebar;