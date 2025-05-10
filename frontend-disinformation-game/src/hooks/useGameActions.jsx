import { useState, useEffect } from "react";
import { evaluateTweetContent } from "../managers/TweetFeedManager";
import { updateUserStats } from "../services/authService";
import { TIME_SCORE_INTERVAL, TIME_SCORE_AMOUNT } from "../managers/GameStateManager";
import { checkFact } from "../services/factCheckApi"; // Add this import

export function useGameActions(gameState, upgradeEffects, processedTweets, setProcessedTweets) {
  const [scoreBreakdown, setScoreBreakdown] = useState({
    correctFlags: 0,
    incorrectFlags: 0,
    missedMisinformation: 0,
    speedBonus: 0,
  });

  const { messageFeed, setMessageFeed, setCurrentMessage, setIsModalOpen, baseScore, setBaseScore, messagesHandled, setMessagesHandled, feedSpeed, gameOver, user, score, gameStarted, timeScoreTimerRef, setTimeScore } = gameState;

  // Calculate speed multiplier for scoring
  const getSpeedMultiplier = (speed) => {
    if (speed === 0.5) return 1; // Slow
    if (speed === 1) return 1.5; // Normal
    if (speed === 2) return 2; // Fast
    return 1; // Default
  };

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

  // Main moderation action handler
  const handleModeration = async (messageId, action) => {
    if (action === "factcheck") {
      // Get the selected message
      const message = messageFeed.find((msg) => msg.id === messageId);
      if (!message) return;

      // Check if we have fact checks remaining
      if (gameState.factChecksRemaining <= 0) {
        console.log("No fact checks remaining");
        return;
      }

      try {
        // Set loading state
        gameState.setLoading(true);

        // Call the fact check API
        console.log(`Performing fact check on: "${message.content}"`);
        const factCheckResult = await checkFact(message.content);

        // Store the result in state
        gameState.setFactCheckResults((prev) => ({
          ...prev,
          [messageId]: factCheckResult,
        }));

        // Decrement available fact checks
        gameState.setFactChecksRemaining((prev) => prev - 1);

        console.log("Fact check complete:", factCheckResult);
      } catch (error) {
        console.error("Fact check failed:", error);
      } finally {
        gameState.setLoading(false);
      }
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
        // Correct flagging - calculate points with upgrades
        const basePoints = 10;
        const speedBonus = speedMultiplier;
        const upgradeBonus = upgradeEffects.getSpeedMultiplier();
        const pointsEarned = Math.round(basePoints * speedBonus * upgradeBonus);

        setBaseScore(baseScore + pointsEarned);

        // Update score breakdown
        setScoreBreakdown((prev) => ({
          ...prev,
          correctFlags: prev.correctFlags + 1,
          speedBonus: prev.speedBonus + (pointsEarned - basePoints),
        }));
      } else {
        // Wrong flagging - apply penalty reduction from upgrades
        const basePenalty = 5;
        const penaltyMultiplier = upgradeEffects.getMistakePenaltyReduction();
        const penaltyPoints = Math.round(basePenalty * speedMultiplier * penaltyMultiplier);

        setBaseScore(Math.max(0, baseScore - penaltyPoints));

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

  // Calculate penalties at game end
  useEffect(() => {
    if (gameOver && processedTweets.length > 0) {
      const missedMisinformationCount = messageFeed.filter((feedMsg) => {
        // Check if this message is misinformation
        const isMisinformation = evaluateTweetContent(feedMsg.content);
        // Only count it if it's misinformation and still in the feed
        return isMisinformation;
      }).length;

      const basePenalty = 5;
      const penaltyReduction = upgradeEffects.getMistakePenaltyReduction();
      const penaltyPoints = missedMisinformationCount * basePenalty * penaltyReduction;

      if (penaltyPoints > 0) {
        gameState.setScore((currentScore) => Math.max(0, currentScore - penaltyPoints));

        setScoreBreakdown((prev) => ({
          ...prev,
          missedMisinformation: missedMisinformationCount,
        }));
      }
    }
  }, [gameOver, messageFeed, processedTweets.length]);

  return {
    scoreBreakdown,
    setScoreBreakdown,
    handleTweetClick,
    handleCloseModal,
    handleModeration,
  };
}
