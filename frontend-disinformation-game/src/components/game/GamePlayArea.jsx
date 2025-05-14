import React from "react";
import { TimerDisplay } from "./GamePanels";
import MessageCard from "../tweets/MessageCard";
import TweetModal from "../tweets/TweetModal";

function GamePlayArea({ timeRemaining, feedSpeed, changeFeedSpeed, score, messageFeed, handleTweetClick, isModalOpen, currentMessage, handleCloseModal, handleModeration, factCheckResults, loading, factChecksRemaining }) {
  return (
    <>
      <div className="rounded-lg bg-gray-50 p-6 shadow-md ">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
          <h1 className="text-2xl font-bold">Truth Social</h1>
          <TimerDisplay timeRemaining={timeRemaining} feedSpeed={feedSpeed} changeFeedSpeed={changeFeedSpeed} score={score} />
        </div>

        <div className="mb-6 space-y-4 flex">
          <div>
          {messageFeed.length === 0 ? (
            <p className="text-center text-gray-500 italic">Waiting for tweets...</p>
          ) : (
            messageFeed.map((message) => (
              <div key={message.id} className={`transition-all duration-500 ${message.isNew ? "-translate-y-4 transform opacity-0" : "translate-y-0 transform opacity-100"}`} onClick={() => handleTweetClick(message)}>
                <MessageCard
                  message={message}
                  hideButtons={true} // Hide all buttons in the feed view
                  clickable={true} // Make the whole card clickable
                />
              </div>
            ))
          )}
          </div>
      {isModalOpen && currentMessage && <TweetModal message={currentMessage} onClose={handleCloseModal} onModerate={handleModeration} factCheckResult={factCheckResults[currentMessage.id]} loading={loading} factChecksRemaining={factChecksRemaining} />}
          
        </div>
      </div>

      {/* Tweet Modal with Fact Check Panel */}
    </>
  );
}

export default GamePlayArea;
