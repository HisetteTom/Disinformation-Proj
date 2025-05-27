import { useState, useEffect, useRef } from "react";
import { fetchTweets } from "../services/tweetApi";
import { parseTwitterDate } from "../utils/gameUtils";

export const GAME_DURATION = 1 * 60 * 1000;
export const TIME_SCORE_INTERVAL = 2000;
export const TIME_SCORE_AMOUNT = 5;
export const INITIAL_TWEETS_COUNT = 5;
export const REFRESH_INTERVAL = 8000;

export function useGameState(onReset, upgradeEffects = null, user = null) {
  const [gameMessages, setGameMessages] = useState([]);
  const [messageFeed, setMessageFeed] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [factCheckResults, setFactCheckResults] = useState({});
  const [score, setScore] = useState(0);
  const [baseScore, setBaseScore] = useState(0);
  const [timeScore, setTimeScore] = useState(0);
  const [speedBonusScore, setSpeedBonusScore] = useState(0);
  const [penaltiesApplied, setPenaltiesApplied] = useState(0);
  const [messagesHandled, setMessagesHandled] = useState(0);
  const [correctFlags, setCorrectFlags] = useState(0);
  const [incorrectFlags, setIncorrectFlags] = useState(0);
  const [factChecksRemaining, setFactChecksRemaining] = useState(5);
  const [isLoading, setIsLoading] = useState(false); 
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [feedSpeed, setFeedSpeed] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState(null);

  // Track handled messages for penalty calculation
  const [handledMessageIds, setHandledMessageIds] = useState(new Set());

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

  // Calculate total score whenever components change
  useEffect(() => {
    const newTotalScore = Math.max(0, baseScore + timeScore + speedBonusScore - penaltiesApplied);

    console.log(`🔄 SCORE RECALCULATION:`);
    console.log(`  - baseScore: ${baseScore}`);
    console.log(`  - timeScore: ${timeScore}`);
    console.log(`  - speedBonusScore: ${speedBonusScore}`);
    console.log(`  - penaltiesApplied: ${penaltiesApplied}`);
    console.log(`  - Previous total: ${score}`);
    console.log(`  - New total: ${newTotalScore}`);

    setScore(newTotalScore);
  }, [baseScore, timeScore, speedBonusScore, penaltiesApplied]);

  const startTimeScoring = (upgradeBonus = 0) => {
    console.log(`⏰ Starting time scoring with upgrade bonus: ${upgradeBonus}`);

    if (timeScoreTimerRef.current) {
      clearInterval(timeScoreTimerRef.current);
      timeScoreTimerRef.current = null;
    }

    timeScoreTimerRef.current = setInterval(() => {
      setTimeScore((prev) => {
        const increment = TIME_SCORE_AMOUNT * (1 + upgradeBonus);
        const newScore = Math.round(prev + increment);
        console.log(`⏰ Time score increment: ${prev} + ${increment} = ${newScore}`);
        return newScore;
      });
    }, TIME_SCORE_INTERVAL);
  };

  // CONSOLIDATED SCORING FUNCTIONS
  const addCorrectFlag = (points = 10) => {
    console.log(`✅ CORRECT FLAG: Adding ${points} points to base score`);
    setBaseScore((prev) => {
      const newScore = prev + points;
      console.log(`  - Previous base score: ${prev}`);
      console.log(`  - New base score: ${newScore}`);
      return newScore;
    });
    setCorrectFlags((prev) => prev + 1);
  };

  const addIncorrectFlag = (penalty = 5) => {
    console.log(`❌ INCORRECT FLAG: Adding ${penalty} penalty`);
    setPenaltiesApplied((prev) => {
      const newPenalty = prev + penalty;
      console.log(`  - Previous penalties: ${prev}`);
      console.log(`  - New penalties: ${newPenalty}`);
      return newPenalty;
    });
    setIncorrectFlags((prev) => prev + 1);
  };

  const addSpeedBonus = (bonus) => {
    console.log(`⚡ SPEED BONUS: Adding ${bonus} points`);
    setSpeedBonusScore((prev) => {
      const newScore = prev + bonus;
      console.log(`  - Previous speed bonus: ${prev}`);
      console.log(`  - New speed bonus: ${newScore}`);
      return newScore;
    });
  };

  const handleMessageModeration = (messageId, isCorrect, points = 10, penalty = 5) => {
    console.log(`🎯 HANDLING MODERATION for message ${messageId}: ${isCorrect ? "CORRECT" : "INCORRECT"}`);

    // Track this message as handled
    setHandledMessageIds((prev) => new Set([...prev, messageId]));
    setMessagesHandled((prev) => prev + 1);

    if (isCorrect) {
      addCorrectFlag(points);
    } else {
      addIncorrectFlag(penalty);
    }
  };

  const calculateMissedMisinformationPenalty = () => {
    console.log(`🏁 CALCULATING MISSED MISINFORMATION PENALTIES`);

    // Find all misinformation tweets that were shown but not handled
    const shownMisinformationTweets = messageFeed.filter((msg) => msg.isDisinfo);
    const missedMisinformation = shownMisinformationTweets.filter((msg) => !handledMessageIds.has(msg.id));

    console.log(`📊 MISSED MISINFORMATION ANALYSIS:`);
    console.log(`  - Total shown misinformation tweets: ${shownMisinformationTweets.length}`);
    console.log(`  - Handled message IDs:`, Array.from(handledMessageIds));
    console.log(`  - Missed misinformation tweets: ${missedMisinformation.length}`);

    if (missedMisinformation.length > 0) {
      console.log(`❌ Missed misinformation tweets:`);
      missedMisinformation.forEach((tweet) => {
        console.log(`  - ID ${tweet.id}: "${tweet.content.substring(0, 50)}..."`);
      });

      // Calculate penalty (base 5 points per missed tweet, reduced by upgrades)
      const basePenaltyPerMiss = 5;
      const penaltyReduction = upgradeEffects?.penaltyReduction || 0;
      const penaltyPerMiss = Math.max(1, basePenaltyPerMiss - penaltyReduction);
      const totalMissedPenalty = missedMisinformation.length * penaltyPerMiss;

      console.log(`💸 MISSED MISINFORMATION PENALTY CALCULATION:`);
      console.log(`  - Missed count: ${missedMisinformation.length}`);
      console.log(`  - Base penalty per miss: ${basePenaltyPerMiss}`);
      console.log(`  - Penalty reduction from upgrades: ${penaltyReduction}`);
      console.log(`  - Actual penalty per miss: ${penaltyPerMiss}`);
      console.log(`  - Total missed penalty: ${totalMissedPenalty}`);

      // Apply the penalty
      setPenaltiesApplied((prev) => {
        const newTotal = prev + totalMissedPenalty;
        console.log(`  - Previous total penalties: ${prev}`);
        console.log(`  - New total penalties: ${newTotal}`);
        return newTotal;
      });

      return {
        missedCount: missedMisinformation.length,
        penalty: totalMissedPenalty,
        missedTweets: missedMisinformation,
      };
    }

    return { missedCount: 0, penalty: 0, missedTweets: [] };
  };

  const getFinalGameStats = () => {
    const finalStats = {
      score: score,
      baseScore: baseScore,
      timeScore: timeScore,
      speedBonusScore: speedBonusScore,
      penaltiesApplied: penaltiesApplied,
      messagesHandled: messagesHandled,
      correctFlags: correctFlags,
      incorrectFlags: incorrectFlags,
      totalMessages: messageFeed.length,
      selectedHashtag: selectedHashtag,
    };

    console.log(`📊 FINAL GAME STATS:`, finalStats);
    return finalStats;
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

    // Reset all state
    setGameMessages([]);
    setMessageFeed([]);
    setCurrentMessage(null);
    setFactCheckResults({});
    setScore(0);
    setBaseScore(0);
    setTimeScore(0);
    setSpeedBonusScore(0);
    setPenaltiesApplied(0);
    setMessagesHandled(0);
    setCorrectFlags(0);
    setIncorrectFlags(0);
    setFactChecksRemaining(5);
    setGameStarted(false);
    setGameOver(false);
    setTimeRemaining(GAME_DURATION);
    setHandledMessageIds(new Set());
    setSelectedHashtag(null);
    setIsLoading(false); // Reset to false to show welcome screen
    messagesIndexRef.current = 0;
  };

  const loadTweets = async (hashtag = null) => {
    try {
      setIsLoading(true);
      console.log(`Loading tweets${hashtag ? ` for hashtag: ${hashtag}` : ""}`);

      const tweetsData = await fetchTweets(hashtag);

      console.log("Raw tweets data sample:", tweetsData[0]);
      console.log(`Loaded ${tweetsData.length} tweets${hashtag ? ` for hashtag: ${hashtag}` : ""}`);

      const formattedTweets = tweetsData.map((tweet, index) => {
        // Use the actual tweet ID if it exists, otherwise fall back to a generated ID
        let tweetId;
        if (tweet.id && tweet.id !== null && tweet.id !== undefined) {
          tweetId = tweet.id;
        } else if (tweet.Tweet_ID && tweet.Tweet_ID !== null && tweet.Tweet_ID !== undefined) {
          tweetId = tweet.Tweet_ID;
        } else {
          // Fallback to index-based ID but make it unique
          tweetId = `tweet_${index}_${Date.now()}`;
        }

        console.log(`Tweet ${index}: Using ID ${tweetId}`);

        return {
          id: tweetId,
          author: tweet.Username || `User${index}`,
          content: tweet.Text || "",
          timestamp: parseTwitterDate(tweet.Created_At),
          likes: parseInt(tweet.Likes) || 0,
          shares: parseInt(tweet.Retweets) || 0,
          profilePic: tweet.Profile_Pic || "",
          mediaFiles: tweet.Media_Files ? tweet.Media_Files.split("|") : [],
          hashtags: tweet.Hashtags || "",
          isNew: true,
          isDisinfo: tweet.is_disinfo === true || tweet.is_disinfo === "true",
        };
      });

      console.log("Formatted tweets sample:", formattedTweets[0]);
      console.log(
        "All tweet IDs:",
        formattedTweets.map((t) => t.id),
      );

      // Validate that all tweets have valid IDs
      const invalidTweets = formattedTweets.filter((tweet) => !tweet.id || tweet.id === null || tweet.id === undefined);
      if (invalidTweets.length > 0) {
        console.error("Found tweets with invalid IDs:", invalidTweets);
      }

      const seed = (sessionIdRef.current % 1000) / 1000;
      const shuffled = [...formattedTweets].sort(() => 0.5 - Math.random() + seed * 0.2 - 0.1);
      setGameMessages(shuffled);

      console.log(`Successfully loaded and formatted ${shuffled.length} tweets${hashtag ? ` for hashtag: ${hashtag}` : ""}`);
      
      // Return the tweets directly so they can be used immediately
      return shuffled;
    } catch (error) {
      console.error("Error loading tweets:", error);
      // Set empty array on error to prevent infinite loading
      setGameMessages([]);
      return []; // Return empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const changeFeedSpeed = (newSpeed) => {
    setFeedSpeed(newSpeed);
  };

  return {
    // State
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
    speedBonusScore,
    setSpeedBonusScore,
    penaltiesApplied,
    setPenaltiesApplied,
    messagesHandled,
    setMessagesHandled,
    correctFlags,
    incorrectFlags,
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
    selectedHashtag,
    setSelectedHashtag,

    // Refs
    gameTimerRef,
    refreshTimerRef,
    timeScoreTimerRef,
    messagesIndexRef,
    sessionIdRef,

    // Functions
    resetGameState,
    startTimeScoring,
    handleMessageModeration,
    addCorrectFlag,
    addIncorrectFlag,
    addSpeedBonus,
    calculateMissedMisinformationPenalty,
    getFinalGameStats,
    loadTweets,
  };
}