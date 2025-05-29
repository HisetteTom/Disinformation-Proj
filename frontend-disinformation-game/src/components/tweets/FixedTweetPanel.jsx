import React from "react";
import { FactCheckPanel } from "../game/GamePanels";
import MessageCard from "./MessageCard";

function FixedTweetPanel({ 
  selectedTweet, 
  onModerate, 
  factCheckResult, 
  loading, 
  factChecksRemaining, 
  isVisible,
  showButtons = true, 
  hideButtons = false 
}) {
  if (!selectedTweet) return null;

  return (
    <div className="rounded-lg bg-gray-50 p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold">Tweet Analysis</h2>
      </div>

      <div className="space-y-6">
        <MessageCard 
          message={selectedTweet} 
          hideButtons={hideButtons} 
          hideApproveButton={false}
          clickable={false} 
          onModerate={onModerate}
          isExpanded={true}
        />
        
        <FactCheckPanel 
          factCheckResult={factCheckResult} 
          loading={loading} 
          factChecksRemaining={factChecksRemaining} 
          handleModeration={onModerate}
          currentMessageId={selectedTweet.id}
        />
      </div>
    </div>
  );
}

export default FixedTweetPanel;