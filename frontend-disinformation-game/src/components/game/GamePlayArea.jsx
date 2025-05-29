import React, { useState } from "react";
import { TimerDisplay } from "./GamePanels";
import MessageCard from "../tweets/MessageCard";
import FixedTweetPanel from "../tweets/FixedTweetPanel";

function GamePlayArea({ timeRemaining, feedSpeed, changeFeedSpeed, score, messageFeed, handleTweetClick, isModalOpen, currentMessage, handleCloseModal, handleModeration, factCheckResults, loading, factChecksRemaining }) {
  // Track which tweet is selected
  const [selectedTweet, setSelectedTweet] = useState(null);
  
  // Handle tweet selection
  const handleTweetSelect = (tweet) => {
    if (selectedTweet && selectedTweet.id === tweet.id) {
      // If clicking the same tweet, deselect it
      setSelectedTweet(null);
    } else {
      // Select the clicked tweet
      setSelectedTweet(tweet);
      // Also trigger the original handler for API calls
      handleTweetClick(tweet);
    }
  };
  
  // Create a wrapper for handleModeration that also clears the selected tweet
  const handleTweetModeration = (messageId, action) => {
    // Call the original handleModeration
    handleModeration(messageId, action);
    
    // Close the panel by clearing selected tweet when approving or flagging
    if (action === "approve" || action === "flag") {
      setSelectedTweet(null);
    }
  };
  
  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* Main container */}
      <div className={`flex transition-all duration-500 ${selectedTweet ? "justify-between" : "justify-center"}`}>
        {/* Tweet feed panel - centered when no tweet selected */}
        <div className={`${selectedTweet ? "w-[56%]" : "w-full max-w-3xl"} transition-all duration-500`}>
          <div className="rounded-lg bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 shadow-md border border-[#4DA6FF]/30">
            <div className="mb-6 flex items-center justify-between border-b border-[#4DA6FF]/30 pb-3">
              <h1 className="text-2xl font-bold text-white text-shadow">Truth Social</h1>
              <TimerDisplay timeRemaining={timeRemaining} feedSpeed={feedSpeed} changeFeedSpeed={changeFeedSpeed} />
            </div>
            
            <div className="flex flex-col items-center">
              <div className="space-y-6 w-full pr-2">
                {messageFeed.length === 0 ? (
                  <p className="text-center text-[#4DA6FF]/80 italic">Waiting for tweets...</p>
                ) : (
                  messageFeed.map((message) => (
                    <div 
                      key={message.id} 
                      className={`transition-all duration-500 ${message.isNew ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100"} p-2`}
                    >
                      <MessageCard
                        message={message}
                        hideButtons={true}
                        clickable={true}
                        onClick={() => handleTweetSelect(message)}
                        isExpanded={selectedTweet && selectedTweet.id === message.id}
                        onModerate={handleTweetModeration} 
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fact check panel - Fixed position when tweet selected */}
        {selectedTweet && (
          <div 
            className={`w-[40%] transition-all duration-500 ${
              selectedTweet ? "opacity-100 transform translate-x-0" : "opacity-0 pointer-events-none"
            } md:sticky md:top-4`}
          >
            <FixedTweetPanel
              selectedTweet={selectedTweet}
              onModerate={handleTweetModeration}
              factCheckResult={selectedTweet ? factCheckResults[selectedTweet.id] : null}
              loading={loading}
              factChecksRemaining={factChecksRemaining}
              isVisible={!!selectedTweet}
              showButtons={true}
              hideButtons={false}
            />
          </div>
        )}
      </div>

      {/* Game timer and score display */}
      <div className="fixed bottom-4 left-0 right-0 flex items-center justify-center md:hidden">
        <div className="game-timer rounded-full bg-[#123C6D] px-4 py-2 shadow-lg border border-[#4DA6FF]/40 text-white">
          <p className="text-center font-bold">
            Time: {Math.floor(timeRemaining / 60000)}:{String(Math.floor((timeRemaining % 60000) / 1000)).padStart(2, '0')} | 
            Score: {score}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GamePlayArea;