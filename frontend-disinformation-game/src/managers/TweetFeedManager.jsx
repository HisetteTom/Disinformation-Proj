import { REFRESH_INTERVAL, INITIAL_TWEETS_COUNT } from "./GameStateManager";

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

  // Start the game timer
  gameTimerRef.current = setInterval(() => {
    setTimeRemaining((prev) => {
      if (prev <= 1000) {
        // When time is up, clear all timers
        clearInterval(gameTimerRef.current);
        clearInterval(refreshTimerRef.current);
        clearInterval(timeScoreTimerRef.current);
        setGameOver(true);
        return 0;
      }
      return prev - 1000;
    });
  }, 1000);

  // Start time scoring - now called directly when the game starts
  startTimeScoring();

  // Start periodic refresh of tweets
  setTimeout(() => {
    startTweetRefresh();
  }, 1000);
}

// Periodically refresh the tweet feed
// Modified to accept timeRemaining as a parameter to prevent tweets in the last 5 seconds
export function createTweetRefresher(refreshTimerRef, feedSpeed, messagesIndexRef, gameMessages, gameOver, setMessageFeed) {
  return () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    const interval = REFRESH_INTERVAL / feedSpeed;

    let isAddingTweet = false;

    refreshTimerRef.current = setInterval(() => {
      // Get current remaining time from the DOM instead of passing as parameter
      // This is cleaner as it doesn't require modifying the component interface
      const timeRemainingElement = document.querySelector('.game-timer');
      const timeRemaining = timeRemainingElement ? 
        parseTimeDisplay(timeRemainingElement.textContent) : 999999;
      
      // Don't add new tweets if less than 5 seconds remain (5000 ms)
      const isFinalCountdown = timeRemaining < 5000;

      if (!isAddingTweet && 
          messagesIndexRef.current < gameMessages.length && 
          !gameOver && 
          !isFinalCountdown) {  // This is the new check
        
        isAddingTweet = true;

        const nextTweet = {
          ...gameMessages[messagesIndexRef.current],
          isNew: true,
        };

        setMessageFeed((prev) => {
          const combined = [nextTweet, ...prev];
          const maxKeep = INITIAL_TWEETS_COUNT * 2;
          return combined.length > maxKeep ? combined.slice(0, maxKeep) : combined;
        });

        messagesIndexRef.current += 1;

        setTimeout(() => {
          setMessageFeed((prevFeed) => prevFeed.map((msg, index) => (index === 0 ? { ...msg, isNew: false } : msg)));
          isAddingTweet = false;
        }, 600);
      }
    }, interval);
  };
}



function parseTimeDisplay(timeDisplay) {
  if (!timeDisplay) return 999999;
  
  const parts = timeDisplay.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return (minutes * 60 + seconds) * 1000;
  }
  
  return 999999; 
}

// Evaluate tweet content for misinformation
export function evaluateTweetContent(message) {
  console.log('Tweet evaluation input:', message);
  
  // If we're passed a complete message object
  if (typeof message === 'object' && message !== null) {
    console.log('Message properties:', Object.keys(message));
    
    // Use the isDisinfo field if available
    if ('isDisinfo' in message) {
      console.log('isDisinfo value found:', message.isDisinfo, typeof message.isDisinfo);
      return message.isDisinfo;
    } else {
      console.log('isDisinfo property NOT found in message!');
    }
    
    // Otherwise fall back to the content
    message = message.content || "";
  }
  
  // This is just a backup check in case isDisinfo is not available
  const regexResult = /covid|vaccine|hoax|engineered|fake|conspiracy|secret|truth|exposed|leaked|bill gates|nanochips|tracking|mind control/i.test(message);
  console.log('Falling back to regex, result:', regexResult);
  return regexResult;
}