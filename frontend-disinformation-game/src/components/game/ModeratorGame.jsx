import React, { useState, useEffect } from "react";
import { checkFact } from "../../services/factCheckApi";
import { LoadingState, GameOver, GameLoadingState } from "./GamePanels";
import { useGameState, GAME_DURATION } from "../../managers/GameStateManager";
import { startGame, createTweetRefresher } from "../../managers/TweetFeedManager";
import GameStartScreen from "./GameStartScreen";
import GamePlayArea from "./GamePlayArea";
import { useUpgradeEffects } from "../../hooks/useUpgradeEffects";
import { useGameActions } from "../../hooks/useGameActions";
import { updateUserUpgrades } from "../../services/authService";
import { TIME_SCORE_INTERVAL, TIME_SCORE_AMOUNT } from "../../managers/GameStateManager";

function ModeratorGame({ onReset, user, onLogin, onGameStateChange, setLiveScore, setTimeLeft }) {
  // Track processed tweets to calculate end-game penalties
  const [processedTweets, setProcessedTweets] = useState([]);
  // Track if money has been saved to prevent duplicate updates
  const [moneySaved, setMoneySaved] = useState(false);
  // Store the user's profile with upgrades
  const [userProfile, setUserProfile] = useState(null);
  // Track if we're fetching the profile
  const [fetchingProfile, setFetchingProfile] = useState(false);
  // Loading screen before game starts - set to true initially to show clear loading state
  const [isInitializing, setIsInitializing] = useState(false);
  // New state to handle clean initial view
  const [appState, setAppState] = useState("welcome"); // 'welcome', 'loading', 'playing', 'gameover'

  const handlePlayAgain = () => {
    // Reset the game state via parent component
    onReset();

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

    // Go back to welcome screen instead of starting a new game directly
    setAppState("welcome");
  };

  // Fetch user profile (with upgrades) from backend when user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      try {
        setFetchingProfile(true);
        const response = await fetch("http://localhost:3001/api/protected/profile", {
          headers: {
            Authorization: `Bearer ${user.stsTokenManager.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        console.log("Fetched user profile:", data.user);
        setUserProfile(data.user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Get upgrade effects based on user PROFILE (which contains upgrades)
  const upgradeEffects = useUpgradeEffects(userProfile);

  // Now we can use upgradeEffects in gameState
  const gameState = useGameState(onReset, upgradeEffects);
  gameState.user = user;

  // Destructure gameState to access properties
  const { gameMessages, messageFeed, currentMessage, factCheckResults, score, timeScore, messagesHandled, factChecksRemaining, isLoading, gameStarted, gameOver, timeRemaining, feedSpeed, changeFeedSpeed, isModalOpen, loading, gameTimerRef, refreshTimerRef, timeScoreTimerRef, messagesIndexRef, setGameStarted, setTimeRemaining, setMessageFeed, setFactCheckResults, setScore, setTimeScore, setMessagesHandled, setFactChecksRemaining, setGameOver } = gameState;

  // Inside your ModeratorGame component - properly notify parent about game state
  useEffect(() => {
    if (gameOver) {
      onGameStateChange(false, true); // isPlaying=false, gameOver=true
      setAppState("gameover");
    } else if (gameStarted) {
      onGameStateChange(true, false); // isPlaying=true, gameOver=false
      setAppState("playing");
    }
  }, [gameStarted, gameOver, onGameStateChange]);

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
    if (gameOver && score > 0 && user && !moneySaved) {
      const updateMoney = async () => {
        try {
          console.log(`Updating money in database: +${score}`);

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
          const currentMoney = parseInt(data.money || 0);
          console.log("Current money from database:", currentMoney);

          // Add score to existing money
          const newMoney = currentMoney + score;

          // Update money in database
          await updateUserUpgrades(newMoney, data.upgrades || {});

          // Mark money as saved to prevent duplicate updates
          setMoneySaved(true);

          // Update local userProfile with new money value
          setUserProfile((prev) => (prev ? { ...prev, money: newMoney } : null));

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

  useEffect(() => {
    if (typeof setLiveScore === "function") {
      setLiveScore(score);
    }
  }, [score, setLiveScore]);

  useEffect(() => {
    if (typeof setTimeLeft === "function") {
      setTimeLeft(timeRemaining);
    }
  }, [timeRemaining, setTimeLeft]);

  const handleStartGame = async () => {
    // Change app state to loading
    setAppState("loading");
    // Show loading screen
    setIsInitializing(true);

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

    const initialFactChecks = 5 + upgradeEffects.getFactChecksBonus();
    console.log(`Starting game with ${initialFactChecks} fact checks (base: 5, bonus: ${upgradeEffects.getFactChecksBonus()})`);

    // Wait for tweets to be loaded if they're not ready yet
    if (gameMessages.length === 0) {
      console.log("Waiting for tweets to load...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    startGame(
      setGameStarted,
      setTimeRemaining,
      setMessageFeed,
      setFactCheckResults,
      setScore,
      setMessagesHandled,
      () => setFactChecksRemaining(initialFactChecks),
      messagesIndexRef,
      gameTimerRef,
      refreshTimerRef,
      timeScoreTimerRef,
      GAME_DURATION,
      startTweetRefresh,
      setGameOver,
      () => gameState.startTimeScoring(upgradeEffects.getTimeScoreBonus()),
    );

    // Add the first tweet immediately
    if (gameMessages.length > 0) {
      const firstTweet = {
        ...gameMessages[0],
        isNew: true,
        appearedAt: Date.now(), // Add timestamp for speed bonus calculation
      };

      console.log("Adding first tweet immediately:", firstTweet.author);

      // Add the first tweet to the feed immediately
      setMessageFeed([firstTweet]);

      // Update the message index since we've used the first tweet
      messagesIndexRef.current = 1;

      // Remove "new" status after animation completes
      setTimeout(() => {
        setMessageFeed((prev) => prev.map((msg) => ({ ...msg, isNew: false })));
      }, 600);
    }

    // Keep loading screen visible for a consistent amount of time
    setTimeout(() => {
      console.log("Setting isInitializing to false");
      setIsInitializing(false);
      setAppState("playing");
    }, 2000);
  };

  // During initial data loading
  if (isLoading || (user && fetchingProfile)) {
    return <LoadingState />;
  }

  // Handle different app states with clear transitions
  switch (appState) {
    case "welcome":
      return <GameStartScreen user={user} onLogin={onLogin} onStartGame={handleStartGame} />;

    case "loading":
      return <GameLoadingState />;

    case "gameover":
      return (
        <GameOver
          score={score}
          messagesHandled={messagesHandled}
          onPlayAgain={handlePlayAgain} // Changed from onReset to handlePlayAgain
          scoreBreakdown={scoreBreakdown}
          timeScore={timeScore}
          user={userProfile || user}
          authUser={user}
          onProfileUpdate={(updatedProfile) => {
            console.log("Profile updated from game over screen:", updatedProfile);
            setUserProfile(updatedProfile);
          }}
        />
      );

    case "playing":
      return <GamePlayArea timeRemaining={timeRemaining} feedSpeed={feedSpeed} changeFeedSpeed={changeFeedSpeed} score={score} messageFeed={messageFeed} handleTweetClick={handleTweetClick} isModalOpen={isModalOpen} currentMessage={currentMessage} handleCloseModal={handleCloseModal} handleModeration={handleModeration} factCheckResults={factCheckResults} loading={loading} factChecksRemaining={factChecksRemaining} />;

    default:
      return <LoadingState />;
  }
}

export default ModeratorGame;
