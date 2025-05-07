import React, { useEffect, useState } from "react";
import { checkFact } from "../services/factCheckApi";
import MessageCard from "./MessageCard";
import { LoadingState, GameOver, TimerDisplay } from "./GamePanels";
import TweetModal from "./TweetModal";
import { useGameState, GAME_DURATION } from "./GameStateManager";
import { startGame, createTweetRefresher, evaluateTweetContent } from "./TweetFeedManager";

function ModeratorGame({ onReset }) {
  const [scoreBreakdown, setScoreBreakdown] = useState({
    correctFlags: 0,
    incorrectFlags: 0,
    missedMisinformation: 0,
    speedBonus: 0
  });
  
  // Get all game state from our custom hook
  const gameState = useGameState(onReset);
  const { 
    gameMessages,
    messageFeed,
    setMessageFeed,
    currentMessage,
    setCurrentMessage,
    factCheckResults,
    setFactCheckResults,
    score,
    setScore,
    messagesHandled,
    setMessagesHandled,
    factChecksRemaining, 
    setFactChecksRemaining,
    isLoading,
    gameStarted,
    setGameStarted,
    gameOver,
    setGameOver,
    timeRemaining,
    setTimeRemaining,
    feedSpeed,
    changeFeedSpeed,
    isModalOpen, 
    setIsModalOpen,
    loading,
    setLoading,
    gameTimerRef,
    refreshTimerRef,
    messagesIndexRef
  } = gameState;

  // Track processed tweets to calculate end-game penalties
  const [processedTweets, setProcessedTweets] = useState([]);

  // Create tweet refresher function
  const startTweetRefresh = createTweetRefresher(
    refreshTimerRef,
    feedSpeed,
    messagesIndexRef,
    gameMessages,
    gameOver,
    setMessageFeed
  );

  // Update tweet refresh rate when speed changes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      startTweetRefresh();
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [feedSpeed, gameStarted, gameOver]);

  // Calculate speed multiplier for scoring
  const getSpeedMultiplier = (speed) => {
    if (speed === 0.5) return 1;    // Slow
    if (speed === 1) return 1.5;    // Normal
    if (speed === 2) return 2;      // Fast
    return 1; // Default
  };

  // Calculate score at game end for missed misinformation
    // Calculate score at game end for missed misinformation
    useEffect(() => {
      if (gameOver && processedTweets.length > 0) {
        const missedMisinformationCount = messageFeed.filter(
          feedMsg => {
            const isMisinformation = evaluateTweetContent(feedMsg.content);
            return isMisinformation;
          }
        ).length;
        
        const penaltyPoints = missedMisinformationCount * 5;
        
        if (penaltyPoints > 0) {
          setScore(currentScore => Math.max(0, currentScore - penaltyPoints));
          
          setScoreBreakdown(prev => ({
            ...prev,
            missedMisinformation: missedMisinformationCount
          }));
        }
      }
    }, [gameOver]);

  // Handle tweet selection
  const handleTweetClick = (message) => {
    setCurrentMessage(message);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentMessage(null);
  };

  // Handle moderation actions
  const handleModeration = async (messageId, action) => {
    if (action === "factcheck") {
      if (factChecksRemaining <= 0) {
        // Update fact check result for this specific tweet
        setFactCheckResults(prev => ({
          ...prev,
          [messageId]: {
            found: false,
            message: "You've used all your fact checks! Make your best judgment."
          }
        }));
        return;
      }

      // Get the selected message
      const message = messageFeed.find(msg => msg.id === messageId);
      if (!message) return;

      setLoading(true);
      
      try {
        const result = await checkFact(message.content);
        
        // Store result for this specific tweet
        setFactCheckResults(prev => ({
          ...prev,
          [messageId]: result
        }));
        
        setFactChecksRemaining(factChecksRemaining - 1);
      } catch (error) {
        console.error("Error checking facts:", error);
      } finally {
        setLoading(false);
      }
      return;
    } 
    
    if (action === "flag") {
      // Get the selected message before removing from feed
      const message = messageFeed.find(msg => msg.id === messageId);
      if (!message) return;
      
      // Check if message is misinformation
      const isMisinformation = evaluateTweetContent(message.content);
      
      // Apply speed-based scoring
      const speedMultiplier = getSpeedMultiplier(feedSpeed);
      
      // Track this tweet as processed
      setProcessedTweets(prev => [
        ...prev, 
        { 
          id: messageId, 
          wasMisinformation: isMisinformation, 
          wasFlagged: true 
        }
      ]);
      
      if (isMisinformation) {
        // Correct flagging
        const pointsEarned = Math.round(10 * speedMultiplier);
        setScore(score + pointsEarned);
        
        // Update score breakdown
        setScoreBreakdown(prev => ({
          ...prev,
          correctFlags: prev.correctFlags + 1,
          speedBonus: prev.speedBonus + (pointsEarned - 10)
        }));
      } else {
        // Wrong flagging
        setScore(Math.max(0, score - Math.round(5 * speedMultiplier)));
        
        // Update score breakdown
        setScoreBreakdown(prev => ({
          ...prev,
          incorrectFlags: prev.incorrectFlags + 1
        }));
      }
      
      // Remove the message from the feed
      setMessageFeed(prev => prev.filter(msg => msg.id !== messageId));
      
      // Close the modal
      setIsModalOpen(false);
      
      setMessagesHandled(messagesHandled + 1);
    }
  };

  // Track tweets that appear in feed but aren't handled
  useEffect(() => {
    if (gameStarted && !gameOver) {
      messageFeed.forEach(message => {
        const alreadyProcessed = processedTweets.some(p => p.id === message.id);
        if (!alreadyProcessed) {
          setProcessedTweets(prev => [
            ...prev,
            {
              id: message.id,
              wasMisinformation: evaluateTweetContent(message.content),
              wasFlagged: false
            }
          ]);
        }
      });
    }
  }, [messageFeed, gameStarted, gameOver]);

  // Start game function that uses imported helper
  const handleStartGame = () => {
    // Reset score breakdown for new game
    setScoreBreakdown({
      correctFlags: 0,
      incorrectFlags: 0,
      missedMisinformation: 0,
      speedBonus: 0
    });
    
    // Reset processed tweets list
    setProcessedTweets([]);
    
    startGame(
      setGameStarted,
      setTimeRemaining,
      setMessageFeed,
      setFactCheckResults,
      setScore,
      setMessagesHandled,
      setFactChecksRemaining,
      messagesIndexRef,
      gameTimerRef,
      refreshTimerRef,
      GAME_DURATION,
      startTweetRefresh,
      setGameOver
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!gameStarted) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Twitter Moderation Challenge</h1>
        <p className="mb-4">
          You'll have 3 minutes to flag as many misinformation tweets as possible.
          Click on tweets to examine them more closely and flag misinformation!
          You have 5 fact checks available to help you make decisions.
        </p>
        <button
          onClick={handleStartGame}
          className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (gameOver) {
    return <GameOver 
      score={score} 
      messagesHandled={messagesHandled} 
      onPlayAgain={onReset}
      scoreBreakdown={scoreBreakdown}
    />;
  }

  return (
    <>
      <div className="rounded-lg bg-gray-50 p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
          <h1 className="text-2xl font-bold">Truth Social</h1>
          <TimerDisplay 
            timeRemaining={timeRemaining} 
            feedSpeed={feedSpeed}
            changeFeedSpeed={changeFeedSpeed}
            score={score}
          />
        </div>

        <div className="mb-6 space-y-4">
          {messageFeed.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              Waiting for tweets...
            </p>
          ) : (
            messageFeed.map((message) => (
              <div 
                key={message.id}
                className={`transition-all duration-500 ${
                  message.isNew 
                    ? "transform -translate-y-4 opacity-0" 
                    : "transform translate-y-0 opacity-100"
                }`}
                onClick={() => handleTweetClick(message)}
              >
                <MessageCard 
                  message={message} 
                  hideButtons={true}  // Hide all buttons in the feed view
                  clickable={true}    // Make the whole card clickable
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tweet Modal with Fact Check Panel */}
      {isModalOpen && currentMessage && (
        <TweetModal
          message={currentMessage}
          onClose={handleCloseModal}
          onModerate={handleModeration}
          factCheckResult={factCheckResults[currentMessage.id]}
          loading={loading}
          factChecksRemaining={factChecksRemaining}
        />
      )}
    </>
  );
}

export default ModeratorGame;