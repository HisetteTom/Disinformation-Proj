import { REFRESH_INTERVAL, INITIAL_TWEETS_COUNT } from './GameStateManager';

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
  setGameOver
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

  // Start periodic refresh of tweets
  setTimeout(() => {
    startTweetRefresh();
  }, 1000);
};

// Periodically refresh the tweet feed
export function createTweetRefresher(
  refreshTimerRef,
  feedSpeed,
  messagesIndexRef,
  gameMessages,
  gameOver,
  setMessageFeed
) {
  return () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    const interval = REFRESH_INTERVAL / feedSpeed;
    
    let isAddingTweet = false;
    
    refreshTimerRef.current = setInterval(() => {
      if (!isAddingTweet && messagesIndexRef.current < gameMessages.length && !gameOver) {
        isAddingTweet = true;
        
        const nextTweet = {
          ...gameMessages[messagesIndexRef.current],
          isNew: true
        };
        
        setMessageFeed(prev => {
          const combined = [nextTweet, ...prev];
          const maxKeep = INITIAL_TWEETS_COUNT * 2;
          return combined.length > maxKeep ? combined.slice(0, maxKeep) : combined;
        });
        
        messagesIndexRef.current += 1;
        
        setTimeout(() => {
          setMessageFeed(prevFeed => 
            prevFeed.map((msg, index) => 
              index === 0 ? { ...msg, isNew: false } : msg
            )
          );
          isAddingTweet = false;
        }, 600);
      }
    }, interval);
  };
}

// Evaluate tweet content for misinformation
export function evaluateTweetContent(content) {
  return /covid|vaccine|hoax|engineered|fake|conspiracy|secret|truth|exposed|leaked|bill gates|nanochips|tracking|mind control/i.test(content);
}