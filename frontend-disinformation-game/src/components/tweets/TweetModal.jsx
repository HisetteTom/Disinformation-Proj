import React from "react";
import MessageCard from "./MessageCard";
import { FactCheckPanel } from "../game/GamePanels";

function TweetModal({ message, onClose, onModerate, factCheckResult, loading, factChecksRemaining }) {
  return (
    <div
      className=" inset-0 items-center space-y-4"
      onClick={onClose} // Add this onClick handler to close when clicking the backdrop
    >
      <div
        className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-white/20 bg-white/95 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()} // Add this to prevent clicks inside modal from closing it
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Examine Tweet</h2>
          <button onClick={onClose} className="rounded-full bg-gray-200 p-2 hover:bg-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="mb-4 md:col-span-3">
            <MessageCard message={message} onModerate={onModerate} onClose={onClose} />
          </div>

          <div className="h-full md:col-span-2">
            <FactCheckPanel factCheckResult={factCheckResult} loading={loading} factChecksRemaining={factChecksRemaining} handleModeration={onModerate} currentMessageId={message.id} largerArticles={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TweetModal;
