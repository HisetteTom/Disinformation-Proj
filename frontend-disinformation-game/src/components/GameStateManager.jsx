import { useState, useEffect, useRef } from 'react';
import { fetchTweets } from "../services/tweetApi";
import { parseTwitterDate } from "../utils/gameUtils";

// Game duration in milliseconds (3 minutes)
export const GAME_DURATION = 60 * 1000;
// Number of initial tweets to show
export const INITIAL_TWEETS_COUNT = 5;
// Refresh interval for tweets (in milliseconds)
export const REFRESH_INTERVAL = 8000;

export function useGameState(onReset) {
  const [gameMessages, setGameMessages] = useState([]);
  const [messageFeed, setMessageFeed] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [factCheckResults, setFactCheckResults] = useState({});
  const [score, setScore] = useState(0);
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
  const messagesIndexRef = useRef(0);
  const sessionIdRef = useRef(Date.now());

  // Reset all game state when component unmounts
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      
      resetGameState();
    };
  }, []);

  // Load tweets on component mount
  useEffect(() => {
    loadTweets();
  }, []);

  const resetGameState = () => {
    setGameMessages([]);
    setMessageFeed([]);
    setCurrentMessage(null);
    setFactCheckResults({});
    setScore(0);
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
        mediaFiles: tweet.Media_Files ? tweet.Media_Files.split('|') : [],
        isNew: true
      }));
      
      // Use session ID to ensure different randomization each time
      const seed = sessionIdRef.current % 1000 / 1000;
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
    messagesIndexRef,
    sessionIdRef,
    resetGameState
  };
}