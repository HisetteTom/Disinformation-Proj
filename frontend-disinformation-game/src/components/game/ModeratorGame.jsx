import React, { useState, useEffect } from "react";
import { checkFact } from "../../services/factCheckApi";
import { LoadingState, GameOver, GameLoadingState } from "./GamePanels";
import { useGameState, GAME_DURATION } from "../../managers/GameStateManager";
import { startGame, createTweetRefresher } from "../../managers/TweetFeedManager";
import GameStartScreen from "./GameStartScreen";
import GamePlayArea from "./GamePlayArea";
import HashtagSelector from "./HashtagSelector";
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
  // New state to handle clean initial view including hashtag mode
  const [gameMode, setGameMode] = useState("welcome"); // 'welcome', 'hashtag-select', 'loading', 'playing', 'gameover'
  // Legacy app state for backward compatibility
  const [appState, setAppState] = useState("welcome");

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
    setGameMode("welcome");
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

  // Get upgrade effects based on user profile
  const upgradeEffects = useUpgradeEffects(userProfile);

  // Now we can use upgradeEffects in gameState
  const gameState = useGameState(onReset, upgradeEffects, user);
  gameState.user = user;

  const { gameMessages, messageFeed, currentMessage, factCheckResults, score, timeScore, speedBonusScore, messagesHandled, factChecksRemaining, isLoading, gameStarted, gameOver, timeRemaining, feedSpeed, changeFeedSpeed, isModalOpen, loading, gameTimerRef, refreshTimerRef, timeScoreTimerRef, messagesIndexRef, setGameStarted, setTimeRemaining, setMessageFeed, setFactCheckResults, setScore, setTimeScore, setMessagesHandled, setFactChecksRemaining, setGameOver } = gameState;

  // Inside your ModeratorGame component - properly notify parent about game state
  useEffect(() => {
    if (gameOver) {
      onGameStateChange(false, true); // isPlaying=false, gameOver=true
      setGameMode("gameover");
      setAppState("gameover");
    } else if (gameStarted) {
      onGameStateChange(true, false); // isPlaying=true, gameOver=false
      setGameMode("playing");
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
    setGameMode("loading");
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
    setMoneySaved(false);

    const initialFactChecks = 5 + upgradeEffects.getFactChecksBonus();
    console.log(`Starting game with ${initialFactChecks} fact checks (base: 5, bonus: ${upgradeEffects.getFactChecksBonus()})`);

    // Load tweets (without hashtag filter for standard mode)
    const loadedTweets = await gameState.loadTweets(null);

    // Use the returned tweets directly instead of waiting for state
    if (!loadedTweets || loadedTweets.length === 0) {
      console.error("No tweets loaded. Cannot start game.");
      setGameMode("welcome");
      setAppState("welcome");
      setIsInitializing(false);
      return;
    }

    console.log(`Starting game with ${loadedTweets.length} tweets loaded`);

    // Wait a bit for state to update before starting the game
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create a custom tweet refresher that uses loadedTweets directly
    const startTweetRefreshWithTweets = () => {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      // Calculate refresh interval based on feed speed
      const refreshInterval = feedSpeed === 0.5 ? 10000 : feedSpeed === 1 ? 7000 : 4000;

      console.log(`Starting tweet refresh with interval ${refreshInterval}ms, tweets length: ${loadedTweets.length}, current index: ${messagesIndexRef.current}`);

      // Set up a new interval to add tweets periodically
      refreshTimerRef.current = setInterval(() => {
        if (gameOver) {
          clearInterval(refreshTimerRef.current);
          return;
        }

        const messageIndex = messagesIndexRef.current;
        
        console.log(`Tweet refresh tick - messageIndex: ${messageIndex}, tweets length: ${loadedTweets.length}`);
        
        if (messageIndex < loadedTweets.length) {
          const newTweet = {
            ...loadedTweets[messageIndex],
            isNew: true,
            appearedAt: Date.now(),
          };

          console.log(`Adding tweet ${messageIndex}: ${newTweet.author}`);

          setMessageFeed(prevFeed => {
            // Add new tweet at the beginning of the feed
            const updatedFeed = [newTweet, ...prevFeed];
            
            // Keep only the most recent tweets (last 10)
            return updatedFeed.slice(0, 10);
          });

          // Update the message index for next time
          messagesIndexRef.current = messageIndex + 1;

          // Remove "new" status after animation completes
          setTimeout(() => {
            setMessageFeed(prevFeed => 
              prevFeed.map(msg => 
                msg.id === newTweet.id ? { ...msg, isNew: false } : msg
              )
            );
          }, 600);
        } else {
          console.log("No more tweets to add, clearing refresh interval");
          clearInterval(refreshTimerRef.current);
        }
      }, refreshInterval);
    };

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
      startTweetRefreshWithTweets, // Use the custom refresher
      setGameOver,
      () => gameState.startTimeScoring(upgradeEffects.getTimeScoreBonus()),
    );

    // Add the first tweet immediately - use loadedTweets directly
    if (loadedTweets.length > 0) {
      const firstTweet = {
        ...loadedTweets[0],
        isNew: true,
        appearedAt: Date.now(),
      };

      console.log("Adding first tweet immediately:", firstTweet.author);
      setMessageFeed([firstTweet]);
      messagesIndexRef.current = 1; // Start from index 1 for the refresher

      setTimeout(() => {
        setMessageFeed((prev) => prev.map((msg) => ({ ...msg, isNew: false })));
      }, 600);
    }

    setTimeout(() => {
      setIsInitializing(false);
      setGameMode("playing");
      setAppState("playing");
    }, 2000);
  };

  const handleStartHashtagMode = () => {
    setGameMode("hashtag-select");
  };

  const handleSelectHashtag = async (hashtag) => {
    console.log("Selected hashtag:", hashtag);

    // Set the selected hashtag in game state
    gameState.setSelectedHashtag(hashtag);

    // Change to loading state
    setGameMode("loading");
    setIsInitializing(true);

    // Reset game state
    setScoreBreakdown({
      correctFlags: 0,
      incorrectFlags: 0,
      missedMisinformation: 0,
      speedBonus: 0,
    });
    setProcessedTweets([]);
    setMoneySaved(false);

    const initialFactChecks = 5 + upgradeEffects.getFactChecksBonus();
    console.log(`Starting hashtag game (${hashtag}) with ${initialFactChecks} fact checks`);

    // Load tweets with hashtag filter
    const loadedTweets = await gameState.loadTweets(hashtag);

    if (!loadedTweets || loadedTweets.length === 0) {
      console.error(`No tweets loaded for hashtag "${hashtag}". Cannot start game.`);
      setGameMode("hashtag-select");
      setIsInitializing(false);
      return;
    }

    console.log(`Starting hashtag game with ${loadedTweets.length} tweets loaded for hashtag: ${hashtag}`);

    // Create a custom tweet refresher that uses loadedTweets directly
    const startTweetRefreshWithTweets = () => {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      // Calculate refresh interval based on feed speed
      const refreshInterval = feedSpeed === 0.5 ? 10000 : feedSpeed === 1 ? 7000 : 4000;

      console.log(`Starting hashtag tweet refresh with interval ${refreshInterval}ms, tweets length: ${loadedTweets.length}, current index: ${messagesIndexRef.current}`);

      // Set up a new interval to add tweets periodically
      refreshTimerRef.current = setInterval(() => {
        if (gameOver) {
          clearInterval(refreshTimerRef.current);
          return;
        }

        const messageIndex = messagesIndexRef.current;
        
        console.log(`Hashtag tweet refresh tick - messageIndex: ${messageIndex}, tweets length: ${loadedTweets.length}`);
        
        if (messageIndex < loadedTweets.length) {
          const newTweet = {
            ...loadedTweets[messageIndex],
            isNew: true,
            appearedAt: Date.now(),
          };

          console.log(`Adding hashtag tweet ${messageIndex}: ${newTweet.author}`);

          setMessageFeed(prevFeed => {
            // Add new tweet at the beginning of the feed
            const updatedFeed = [newTweet, ...prevFeed];
            
            // Keep only the most recent tweets (last 10)
            return updatedFeed.slice(0, 10);
          });

          // Update the message index for next time
          messagesIndexRef.current = messageIndex + 1;

          // Remove "new" status after animation completes
          setTimeout(() => {
            setMessageFeed(prevFeed => 
              prevFeed.map(msg => 
                msg.id === newTweet.id ? { ...msg, isNew: false } : msg
              )
            );
          }, 600);
        } else {
          console.log("No more hashtag tweets to add, clearing refresh interval");
          clearInterval(refreshTimerRef.current);
        }
      }, refreshInterval);
    };

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
      startTweetRefreshWithTweets, // Use the custom refresher
      setGameOver,
      () => gameState.startTimeScoring(upgradeEffects.getTimeScoreBonus()),
    );

    // Add the first tweet immediately - use loadedTweets directly
    if (loadedTweets.length > 0) {
      const firstTweet = {
        ...loadedTweets[0],
        isNew: true,
        appearedAt: Date.now(),
      };

      setMessageFeed([firstTweet]);
      messagesIndexRef.current = 1;

      setTimeout(() => {
        setMessageFeed((prev) => prev.map((msg) => ({ ...msg, isNew: false })));
      }, 600);
    }

    setTimeout(() => {
      setIsInitializing(false);
      setGameMode("playing");
    }, 2000);
  };

  const handleBackToMenu = () => {
    setGameMode("welcome");
  };

  // During initial data loading
  if (isLoading || (user && fetchingProfile)) {
    return <LoadingState />;
  }

  // Handle different game modes with clear transitions
  switch (gameMode) {
    case "welcome":
      return <GameStartScreen user={user} onLogin={onLogin} onStartGame={handleStartGame} onStartHashtagMode={handleStartHashtagMode} />;

    case "hashtag-select":
      return <HashtagSelector onSelectHashtag={handleSelectHashtag} onBack={handleBackToMenu} />;

    case "loading":
      return <GameLoadingState />;

    case "gameover":
      return (
        <GameOver
          score={score}
          messagesHandled={messagesHandled}
          onPlayAgain={handlePlayAgain}
          scoreBreakdown={scoreBreakdown}
          timeScore={timeScore}
          speedBonusScore={speedBonusScore}
          user={userProfile || user}
          authUser={user}
          onProfileUpdate={(updatedProfile) => {
            console.log("Profile updated from game over screen:", updatedProfile);
            setUserProfile(updatedProfile);
          }}
          selectedHashtag={gameState.selectedHashtag}
        />
      );

    case "playing":
      return <GamePlayArea timeRemaining={timeRemaining} feedSpeed={feedSpeed} changeFeedSpeed={changeFeedSpeed} score={score} messageFeed={messageFeed} handleTweetClick={handleTweetClick} isModalOpen={isModalOpen} currentMessage={currentMessage} handleCloseModal={handleCloseModal} handleModeration={handleModeration} factCheckResults={factCheckResults} loading={loading} factChecksRemaining={factChecksRemaining} selectedHashtag={gameState.selectedHashtag} />;

    default:
      return <LoadingState />;
  }
}

export default ModeratorGame;