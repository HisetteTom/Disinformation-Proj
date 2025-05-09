import React, { useEffect, useState } from "react";
import { checkFact } from "../services/factCheckApi";
import MessageCard from "./MessageCard";
import { LoadingState, GameOver, TimerDisplay } from "./GamePanels";
import TweetModal from "./TweetModal";
import { useGameState, GAME_DURATION } from "./GameStateManager";
import {
  startGame,
  createTweetRefresher,
  evaluateTweetContent,
} from "./TweetFeedManager";
import { updateUserStats } from "../services/authService";
import Upgrade from "../data/listUpgrade";

function ModeratorGame({ onReset, user, onLogin }) {
  const [scoreBreakdown, setScoreBreakdown] = useState({
    correctFlags: 0,
    incorrectFlags: 0,
    missedMisinformation: 0,
    speedBonus: 0,
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
    baseScore,
    setBaseScore,
    timeScore,
    setTimeScore,
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
    timeScoreTimerRef,
    messagesIndexRef,
  } = gameState;


  //define effect of the upgrade
  var upgradeEffect ={};
  if(user){
    user.upgrades = { fact_checker: 1, speed_bonus: 1, mistake_shield: 1, time_bonus : 1 };
    
    for (let presentupgrade in user.upgrades) {
      var correspondance = Upgrade.find((element => element.id === presentupgrade));
      if(correspondance != undefined){
          for(var unique in correspondance.effect(user.upgrades[presentupgrade])){
            upgradeEffect[unique] = correspondance.effect(user.upgrades[presentupgrade])[unique];
          }
        }   
      
    }
    
  }

  console.log(upgradeEffect);
//     console.log(typeof(upgradeEffect));
//     console.log(upgradeEffect instanceof Map);
//     console.log(upgradeEffect instanceof Set);
//     console.log(upgradeEffect instanceof Object);
// console.log(Object.keys(upgradeEffect))

//   erreur
  // if(Object.keys(upgradeEffect).includes("factChecksBonus")){
  //   setFactChecksRemaining(factChecksRemaining + upgradeEffect["factChecksBonus"]);
  // }

  // Track processed tweets to calculate end-game penalties
  const [processedTweets, setProcessedTweets] = useState([]);

  // Create tweet refresher function
  const startTweetRefresh = createTweetRefresher(
    refreshTimerRef,
    feedSpeed,
    messagesIndexRef,
    gameMessages,
    gameOver,
    setMessageFeed,
  );

  // Save game stats when game ends
  useEffect(() => {
    if (gameOver && user) {
      // Save game stats for logged in users
      try {
        const gameStats = {
          score: score,
          correctFlags: scoreBreakdown.correctFlags,
          incorrectFlags: scoreBreakdown.incorrectFlags,
        };

        // Call the API to update stats
        updateUserStats(gameStats)
          .then(() => console.log("Stats saved successfully"))
          .catch((error) => console.error("Error saving stats:", error));
      } catch (error) {
        console.error("Error saving game stats:", error);
      }
    }
  }, [gameOver, user, score, scoreBreakdown]);

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
    if (speed === 0.5) return 1; // Slow
    if (speed === 1) return 1.5; // Normal
    if (speed === 2) return 2; // Fast
    return 1; // Default
  };

  // Calculate score at game end for missed misinformation
  useEffect(() => {
    if (gameOver && processedTweets.length > 0) {
      const missedMisinformationCount = messageFeed.filter((feedMsg) => {
        // Check if this message is misinformation
        const isMisinformation = evaluateTweetContent(feedMsg.content);
        // Only count it if it's misinformation and still in the feed
        return isMisinformation;
      }).length;

      if(Object.keys(upgradeEffect).includes("mistakePenaltyReduction")){
        const penaltyPoints = missedMisinformationCount * 5 *  upgradeEffect["mistakePenaltyReduction"];
      }else{
        const penaltyPoints = missedMisinformationCount * 5;
      }
        

      if (penaltyPoints > 0) {
        setScore((currentScore) => Math.max(0, currentScore - penaltyPoints));

        setScoreBreakdown((prev) => ({
          ...prev,
          missedMisinformation: missedMisinformationCount,
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

  const handleModeration = async (messageId, action) => {
    if (action === "factcheck") {
      // Keep your existing fact check logic
    }
  
    if (action === "flag") {
      // Get the selected message before removing from feed
      const message = messageFeed.find((msg) => msg.id === messageId);
      if (!message) return;
  
      // Check if message is misinformation
      const isMisinformation = evaluateTweetContent(message.content);
  
      // Apply speed-based scoring
      const speedMultiplier = getSpeedMultiplier(feedSpeed);
  
      // Track this tweet as processed
      setProcessedTweets((prev) => [
        ...prev,
        {
          id: messageId,
          wasMisinformation: isMisinformation,
          wasFlagged: true,
        },
      ]);
  
      if (isMisinformation) {
        // Correct flagging - update baseScore instead of score
      if(Object.keys(upgradeEffect).includes("speedMultiplier")){
          const pointsEarned = Math.round(10 * speedMultiplier * upgradeEffect["speedMultiplier"]);
      }
      else{
        const pointsEarned = Math.round(10 * speedMultiplier);

      }
        setBaseScore(baseScore + pointsEarned);
  
        // Update score breakdown
        setScoreBreakdown((prev) => ({
          ...prev,
          correctFlags: prev.correctFlags + 1,
          speedBonus: prev.speedBonus + (pointsEarned - 10),
        }));
      } else {
        // Wrong flagging - update baseScore instead of score
        setBaseScore(Math.max(0, baseScore - Math.round(5 * speedMultiplier)));
  
        // Update score breakdown
        setScoreBreakdown((prev) => ({
          ...prev,
          incorrectFlags: prev.incorrectFlags + 1,
        }));
      }
  
      // Remove the message from the feed
      setMessageFeed((prev) => prev.filter((msg) => msg.id !== messageId));
  
      // Close the modal
      setIsModalOpen(false);
  
      setMessagesHandled(messagesHandled + 1);
    }
  };

  // Track tweets that appear in feed but aren't handled
  useEffect(() => {
    if (gameStarted && !gameOver) {
      messageFeed.forEach((message) => {
        const alreadyProcessed = processedTweets.some(
          (p) => p.id === message.id,
        );
        if (!alreadyProcessed) {
          setProcessedTweets((prev) => [
            ...prev,
            {
              id: message.id,
              wasMisinformation: evaluateTweetContent(message.content),
              wasFlagged: false,
            },
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
      speedBonus: 0,
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
      timeScoreTimerRef,
      GAME_DURATION,
      startTweetRefresh,
      setGameOver,
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!gameStarted) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">
          Twitter Moderation Challenge
        </h1>
        <p className="mb-4">
          You'll have 3 minutes to flag as many misinformation tweets as
          possible. Click on tweets to examine them more closely and flag
          misinformation! You have 5 fact checks available to help you make
          decisions.
        </p>

        {/* Show user status */}
        <div className="mb-4 rounded-md bg-blue-50 p-3">
          {user ? (
            <p className="text-blue-800">
              Playing as: <span className="font-bold">{user.email}</span>
              {/* Your stats will be saved at the end of the game. */}
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-blue-800">
                Playing as <span className="font-semibold">Guest</span> - your
                progress won't be saved.
              </p>
              <button
                onClick={onLogin}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
              >
                Log in
              </button>
            </div>
          )}
        </div>

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
    return (
      <GameOver
        score={score}
        messagesHandled={messagesHandled}
        onPlayAgain={onReset}
        scoreBreakdown={scoreBreakdown}
        timeScore={timeScore}
        user={user}
      />
    );
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
                    ? "-translate-y-4 transform opacity-0"
                    : "translate-y-0 transform opacity-100"
                }`}
                onClick={() => handleTweetClick(message)}
              >
                <MessageCard
                  message={message}
                  hideButtons={true} // Hide all buttons in the feed view
                  clickable={true} // Make the whole card clickable
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
