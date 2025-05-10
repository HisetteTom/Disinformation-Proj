import React, { useState, useEffect } from "react";
import { checkFact } from "../../services/factCheckApi";
import { LoadingState, GameOver } from "./GamePanels";
import { useGameState, GAME_DURATION } from "../../managers/GameStateManager";
import { startGame, createTweetRefresher } from "../../managers/TweetFeedManager";
import GameStartScreen from "./GameStartScreen";
import GamePlayArea from "./GamePlayArea";
import { useUpgradeEffects } from "../../hooks/useUpgradeEffects";
import { useGameActions } from "../../hooks/useGameActions";
import { updateUserUpgrades } from "../../services/authService";

function ModeratorGame({ onReset, user, onLogin }) {
  const gameState = useGameState(onReset);
  const { gameMessages, messageFeed, currentMessage, factCheckResults, score, timeScore, messagesHandled, factChecksRemaining, isLoading, gameStarted, gameOver, timeRemaining, feedSpeed, changeFeedSpeed, isModalOpen, loading, gameTimerRef, refreshTimerRef, timeScoreTimerRef, messagesIndexRef, setGameStarted, setTimeRemaining, setMessageFeed, setFactCheckResults, setScore, setMessagesHandled, setFactChecksRemaining, setGameOver } = gameState;

  // Track processed tweets to calculate end-game penalties
  const [processedTweets, setProcessedTweets] = useState([]);
  // Track if money has been saved to prevent duplicate updates
  const [moneySaved, setMoneySaved] = useState(false);

  // Get upgrade effects based on user
  const upgradeEffects = useUpgradeEffects(user);

  // Get game actions and scoring functionality
  const { scoreBreakdown, setScoreBreakdown, handleTweetClick, handleCloseModal, handleModeration } = useGameActions(gameState, upgradeEffects, processedTweets, setProcessedTweets);

  // Create tweet refresher function
  const startTweetRefresh = createTweetRefresher(refreshTimerRef, feedSpeed, messagesIndexRef, gameMessages, gameOver, setMessageFeed);

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

  // Update user's money in database when game ends
  useEffect(() => {
    // Only run this effect when the game is over, we have a score, and money hasn't been saved yet
    if (gameOver && score > 0 && user && !moneySaved) {
      const updateMoney = async () => {
        try {
          console.log(`Updating money in database: +${score}`);

          // Create a custom endpoint to fetch user money or modify your backend to include it
          const response = await fetch(`http://localhost:3001/api/protected/money`, {
            headers: {
              Authorization: `Bearer ${user.stsTokenManager.accessToken}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user money");
          }

          const data = await response.json();
          // Get current money from money endpoint
          const currentMoney = parseInt(data.money || 0);
          console.log("Current money from database:", currentMoney);

          // Add score to existing money
          const newMoney = currentMoney + score;

          // Update money in database
          await updateUserUpgrades(newMoney, data.upgrades || {});

          // Mark money as saved to prevent duplicate updates
          setMoneySaved(true);
          console.log(`Money updated successfully: ${currentMoney} + ${score} = ${newMoney}`);
        } catch (error) {
          console.error("Error updating money:", error);
        }
      };

      updateMoney();
    }
  }, [gameOver, score, user, moneySaved]);

  // Reset moneySaved flag when starting a new game
  useEffect(() => {
    if (gameStarted && moneySaved) {
      setMoneySaved(false);
    }
  }, [gameStarted]);

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

    // Reset money saved flag
    setMoneySaved(false);

    // Apply upgrade effects before starting game
    const initialFactChecks = 5 + upgradeEffects.getFactChecksBonus();

    startGame(
      setGameStarted,
      setTimeRemaining,
      setMessageFeed,
      setFactCheckResults,
      setScore,
      setMessagesHandled,
      () => setFactChecksRemaining(initialFactChecks), // Apply upgrade bonus
      messagesIndexRef,
      gameTimerRef,
      refreshTimerRef,
      timeScoreTimerRef,
      GAME_DURATION,
      startTweetRefresh,
      setGameOver,
    );
  };

  // Render loading state if data is loading
  if (isLoading) {
    return <LoadingState />;
  }

  // Render game start screen if game hasn't started
  if (!gameStarted) {
    return <GameStartScreen user={user} onLogin={onLogin} onStartGame={handleStartGame} />;
  }

  // Render game over screen if game is over
  if (gameOver) {
    return <GameOver score={score} messagesHandled={messagesHandled} onPlayAgain={onReset} scoreBreakdown={scoreBreakdown} timeScore={timeScore} user={user} />;
  }

  // Render game play area if game is active
  return <GamePlayArea timeRemaining={timeRemaining} feedSpeed={feedSpeed} changeFeedSpeed={changeFeedSpeed} score={score} messageFeed={messageFeed} handleTweetClick={handleTweetClick} isModalOpen={isModalOpen} currentMessage={currentMessage} handleCloseModal={handleCloseModal} handleModeration={handleModeration} factCheckResults={factCheckResults} loading={loading} factChecksRemaining={factChecksRemaining} />;
}

export default ModeratorGame;
