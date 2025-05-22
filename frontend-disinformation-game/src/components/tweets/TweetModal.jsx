import React, { useState, useEffect } from "react";
import MessageCard from "./MessageCard";
import { FactCheckPanel } from "../game/GamePanels";

function TweetModal({ message, onClose, onModerate, factCheckResult, loading, factChecksRemaining }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Animation on mount
  useEffect(() => {
    // Small delay to ensure the animation works correctly
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-7xl h-[85vh] transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 p-4 backdrop-blur">
          <h2 className="text-2xl font-bold text-gray-800">Examine Tweet</h2>
          <button 
            onClick={onClose} 
            className="rounded-full bg-gray-200 p-2 hover:bg-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="h-[calc(85vh-4rem)] overflow-y-auto">
          <div className="p-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="transform scale-125 origin-top-left">
                  <MessageCard 
                    message={message} 
                    onModerate={onModerate} 
                    onClose={onClose} 
                    clickable={false}
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="transform scale-110 origin-top">
                  <FactCheckPanel 
                    factCheckResult={factCheckResult} 
                    loading={loading} 
                    factChecksRemaining={factChecksRemaining} 
                    handleModeration={onModerate} 
                    currentMessageId={message.id} 
                    largerArticles={true} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TweetModal;