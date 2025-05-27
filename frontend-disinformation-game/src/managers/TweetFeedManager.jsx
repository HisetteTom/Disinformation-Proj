import { REFRESH_INTERVAL, INITIAL_TWEETS_COUNT } from "./GameStateManager";

/**
 * Evaluates whether a tweet contains misinformation
 * @param {Object} tweet - The tweet to evaluate
 * @returns {boolean} - True if the tweet contains misinformation
 */
export function evaluateTweetContent(tweet) {
  // Simply check the isDisinfo flag which should be set when tweets are loaded
  return tweet.isDisinfo === true || tweet.isDisinfo === "true";
}

export function startGame(
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
  startTimeScoring,
) {
  setGameStarted(true);
  setTimeRemaining(GAME_DURATION);

  // Reset state to ensure clean game start
  setMessageFeed([]);
  setFactCheckResults({});
  setScore(0);
  setMessagesHandled(0);
  setFactChecksRemaining(5);
  messagesIndexRef.current = 0;

  // Clear any existing timers first
  if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
  if (timeScoreTimerRef.current) clearInterval(timeScoreTimerRef.current);

  // Start the game timer
  gameTimerRef.current = setInterval(() => {
    setTimeRemaining((prev) => {
      if (prev <= 1000) {
        // When time is up, clear all timers immediately
        clearInterval(gameTimerRef.current);
        clearInterval(refreshTimerRef.current);
        clearInterval(timeScoreTimerRef.current);
        
        // Clear references to prevent issues
        gameTimerRef.current = null;
        refreshTimerRef.current = null;
        timeScoreTimerRef.current = null;
        
        // Force transition to game over state
        console.log("TIME'S UP - Transitioning to game over state");
        
        // Use a more reliable approach with a direct timeout
        // This ensures state transitions have time to complete
        setTimeout(() => {
          setGameOver(true);
        }, 500); // Longer delay to ensure state updates properly
        
        return 0;
      }
      return prev - 1000;
    });
  }, 1000);

  // Start time scoring
  startTimeScoring();

  // Start periodic refresh of tweets
  setTimeout(() => {
    startTweetRefresh();
  }, 1000);
}

export function createTweetRefresher(refreshTimerRef, feedSpeed, messagesIndexRef, gameMessages, gameOver, setMessageFeed) {
  return function startTweetRefresh() {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Calculate refresh interval based on feed speed
    const refreshInterval = feedSpeed === 0.5 ? 10000 : feedSpeed === 1 ? 7000 : 4000;

    console.log(`Starting tweet refresh with interval ${refreshInterval}ms, gameMessages length: ${gameMessages.length}, current index: ${messagesIndexRef.current}`);

    // Set up a new interval to add tweets periodically
    refreshTimerRef.current = setInterval(() => {
      if (gameOver) {
        clearInterval(refreshTimerRef.current);
        return;
      }

      const messageIndex = messagesIndexRef.current;
      
      console.log(`Tweet refresh tick - messageIndex: ${messageIndex}, gameMessages length: ${gameMessages.length}`);
      
      if (messageIndex < gameMessages.length) {
        const newTweet = {
          ...gameMessages[messageIndex],
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
}