import { useState, useEffect, useRef } from "react";
import { fetchTweets } from "../services/tweetApi";
import { parseTwitterDate } from "../utils/gameUtils";

export const GAME_DURATION = 25 * 1000; 
// Score awarded every 2 seconds
export const TIME_SCORE_INTERVAL = 2000;
export const TIME_SCORE_AMOUNT = 5;
// Number of initial tweets to show
export const INITIAL_TWEETS_COUNT = 5;
// Refresh interval for tweets (in milliseconds)
export const REFRESH_INTERVAL = 8000;

export function useGameState(onReset, upgradeEffects = null) {
  // All state declarations remain the same
  const [gameMessages, setGameMessages] = useState([]);
  const [messageFeed, setMessageFeed] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [factCheckResults, setFactCheckResults] = useState({});
  const [score, setScore] = useState(0);
  const [baseScore, setBaseScore] = useState(0); // Score from flagging tweets
  const [timeScore, setTimeScore] = useState(0); // Score from time passing
  const [messagesHandled, setMessagesHandled] = useState(0);
  const [factChecksRemaining, setFactChecksRemaining] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [feedSpeed, setFeedSpeed] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs for timers and message tracking
  const gameTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const timeScoreTimerRef = useRef(null);
  const messagesIndexRef = useRef(0);
  const sessionIdRef = useRef(Date.now());

  // Reset all game state when component unmounts
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (timeScoreTimerRef.current) clearInterval(timeScoreTimerRef.current);

      resetGameState();
    };
  }, []);

  // Load tweets on component mount
  useEffect(() => {
    loadTweets();
  }, []);

 useEffect(() => {
    const newTotalScore = baseScore + timeScore;
    setScore(newTotalScore);
    console.log(`Score updated: ${baseScore} (base) + ${timeScore} (time) = ${newTotalScore}`);
  }, [baseScore, timeScore]);

  const startTimeScoring = () => {
    // Clear any existing timer first
    if (timeScoreTimerRef.current) {
      clearInterval(timeScoreTimerRef.current);
      timeScoreTimerRef.current = null;
    }

    console.log("Setting up time scoring once at game start");

    // Start a simple timer that adds 5 points every 2 seconds
    timeScoreTimerRef.current = setInterval(() => {
      setTimeScore((prev) => {
        const newScore = prev + TIME_SCORE_AMOUNT;
        console.log(`Time score +${TIME_SCORE_AMOUNT}: ${newScore}`);
        return newScore;
      });
    }, TIME_SCORE_INTERVAL);
  };

  const resetGameState = () => {
    // Clear all timers
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (timeScoreTimerRef.current) {
      clearInterval(timeScoreTimerRef.current);
      timeScoreTimerRef.current = null;
    }

    // Reset state
    setGameMessages([]);
    setMessageFeed([]);
    setCurrentMessage(null);
    setFactCheckResults({});
    setScore(0);
    setBaseScore(0);
    setTimeScore(0);
    setMessagesHandled(0);
    setFactChecksRemaining(5);
    setGameStarted(false);
    setGameOver(false);
    setTimeRemaining(GAME_DURATION);
    messagesIndexRef.current = 0;
  };

  const loadTweets = async () => {
    try {
      setIsLoading(true);
      const tweetsData = await fetchTweets();

      const formattedTweets = tweetsData.map((tweet, index) => ({
        id: index + 1,
        author: tweet.Username,
        content: tweet.Text,
        timestamp: parseTwitterDate(tweet.Created_At),
        likes: parseInt(tweet.Likes) || 0,
        shares: parseInt(tweet.Retweets) || 0,
        profilePic: tweet.Profile_Pic,
        mediaFiles: tweet.Media_Files ? tweet.Media_Files.split("|") : [],
        isNew: true,
      }));

      // Use session ID to ensure different randomization each time
      const seed = (sessionIdRef.current % 1000) / 1000;
      const shuffled = [...formattedTweets].sort(() => 0.5 - Math.random() + seed * 0.2 - 0.1);
      setGameMessages(shuffled);
    } catch (error) {
      console.error("Error loading tweets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Change the feed speed
  const changeFeedSpeed = (newSpeed) => {
    setFeedSpeed(newSpeed);
  };

  return {
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
    sessionIdRef,
    resetGameState,
    startTimeScoring,
  };
}
