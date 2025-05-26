import { useState, useEffect } from "react";
import { evaluateTweetContent } from "../managers/TweetFeedManager";
import { updateUserStats, saveCorrectlyAnsweredTweets } from "../services/authService";
import { checkFact } from "../services/factCheckApi";

export function useGameActions(gameState, upgradeEffects, processedTweets, setProcessedTweets) {
  const [scoreBreakdown, setScoreBreakdown] = useState({
    correctFlags: 0,
    incorrectFlags: 0,
    missedMisinformation: 0,
    speedBonus: 0,
  });

  // Track all tweets that appeared during the game with timestamps
  const [allGameTweets, setAllGameTweets] = useState([]);
  const [correctlyAnsweredTweets, setCorrectlyAnsweredTweets] = useState([]);

  // Destructure from gameState
  const { 
    messageFeed, 
    setMessageFeed, 
    setCurrentMessage, 
    setIsModalOpen, 
    messagesHandled, 
    setMessagesHandled, 
    feedSpeed, 
    gameOver, 
    score, 
    gameStarted 
  } = gameState;
  
  const user = gameState.user || window.currentUser;

  // Track all tweets that appear in the feed during gameplay WITH TIMESTAMPS
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Add any new tweets to our tracking array with a timestamp
      messageFeed.forEach((tweet) => {
        if (!allGameTweets.some((t) => t.id === tweet.id)) {
          setAllGameTweets((prev) => [
            ...prev,
            {
              ...tweet,
              appearedAt: Date.now(), // Track when tweet appeared
            },
          ]);
        }
      });
    }
  }, [messageFeed, gameStarted, gameOver, allGameTweets]);

  // Reset tracking when game starts
  useEffect(() => {
    if (gameStarted) {
      setAllGameTweets([]);
      setScoreBreakdown({
        correctFlags: 0,
        incorrectFlags: 0,
        missedMisinformation: 0,
        speedBonus: 0,
      });
    }
  }, [gameStarted]);

  // Calculate speed bonus based on reaction time
  const calculateSpeedBonus = (reactionTimeMs) => {
    // Max bonus of 50-60 points, decreasing over 10 seconds
    const maxBonus = 60;
    const minBonus = 0;
    const maxReactionTime = 10000; // 10 seconds

    // Linear decay from max bonus to min bonus over maxReactionTime
    let bonus = Math.max(minBonus, maxBonus - maxBonus * (reactionTimeMs / maxReactionTime));

    // Apply upgrade effects for speed bonus
    const upgradeMultiplier = upgradeEffects.getSpeedMultiplier();
    bonus = Math.round(bonus * upgradeMultiplier);

    return Math.max(0, Math.min(maxBonus, bonus)); // Clamp between 0 and maxBonus
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
    console.log("🔥 handleModeration called with:", messageId, action);

    if (action === "factcheck") {
      console.log("📋 Fact check action");
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

    if (action === "approve") {
      console.log("⭐ APPROVE ACTION STARTED:", messageId);

      // Get the selected message
      const message = messageFeed.find((msg) => msg.id === messageId);
      console.log("⭐ Found message to approve:", message ? "yes" : "no");
      if (!message) {
        console.log("⭐ No message found, returning");
        return;
      }

      console.log("⭐ Message to approve:", message);

      // Check if this was correct (NOT misinformation should be approved)
      const isMisinformation = evaluateTweetContent(message);
      const isCorrect = !isMisinformation; // Correct if it's NOT misinformation

      // Track this tweet as processed but NOT flagged
      setProcessedTweets((prev) => {
        const newProcessed = [
          ...prev,
          {
            id: messageId,
            wasMisinformation: isMisinformation,
            wasFlagged: false, // not flagged
          },
        ];
        return newProcessed;
      });

      // Use GameStateManager function for scoring
      if (isCorrect) {
        gameState.handleMessageModeration(messageId, true, 10, 0); // Correct approval
        setCorrectlyAnsweredTweets(prev => [...prev, messageId]);
        
        // Update breakdown
        setScoreBreakdown((prev) => ({
          ...prev,
          correctFlags: prev.correctFlags + 1,
        }));
      } else {
        // Incorrect approval (approved misinformation)
        const basePenalty = 5;
        const penaltyMultiplier = upgradeEffects.getMistakePenaltyReduction();
        const penaltyPoints = Math.round(basePenalty * penaltyMultiplier);
        
        gameState.handleMessageModeration(messageId, false, 0, penaltyPoints);
        
        // Update breakdown
        setScoreBreakdown((prev) => ({
          ...prev,
          incorrectFlags: prev.incorrectFlags + 1,
        }));
      }

      setIsModalOpen(false);
      setMessagesHandled(messagesHandled + 1);

      console.log("⭐ APPROVE ACTION COMPLETED");
      return;
    }

    if (action === "flag") {
      console.log("🚩 FLAG ACTION STARTED:", messageId);

      // Get the selected message before removing from feed
      const message = messageFeed.find((msg) => msg.id === messageId);
      if (!message) return;

      console.log("Message object to check:", message);

      // Check if message is misinformation
      const isMisinformation = evaluateTweetContent(message);
      console.log("Is misinformation result:", isMisinformation);

      // Track this tweet as processed
      setProcessedTweets((prev) => {
        const newProcessed = [
          ...prev,
          {
            id: messageId,
            wasMisinformation: isMisinformation,
            wasFlagged: true,
          },
        ];
        console.log("Processed tweets updated:", newProcessed);
        return newProcessed;
      });

      if (isMisinformation) {
        console.log("✅ CORRECT flag - tweet is misinformation");
        
        // Track correctly answered tweet
        setCorrectlyAnsweredTweets((prev) => {
          const updated = [...prev, messageId];
          console.log("Updated correctly answered tweets:", updated);
          return updated;
        });

        // Use GameStateManager function for correct flag
        gameState.handleMessageModeration(messageId, true, 10, 0);

        // Calculate and add speed bonus
        const originalTweet = allGameTweets.find((t) => t.id === messageId);
        if (originalTweet && originalTweet.appearedAt) {
          const reactionTimeMs = Date.now() - originalTweet.appearedAt;
          const speedBonus = calculateSpeedBonus(reactionTimeMs);

          console.log(`⚡ Reaction time: ${reactionTimeMs}ms, Speed bonus: ${speedBonus} points`);

          // Use GameStateManager function for speed bonus
          gameState.addSpeedBonus(speedBonus);

          // Update score breakdown
          setScoreBreakdown((prev) => ({
            ...prev,
            speedBonus: prev.speedBonus + speedBonus,
          }));
        }

        // Update score breakdown for correct flags
        setScoreBreakdown((prev) => ({
          ...prev,
          correctFlags: prev.correctFlags + 1,
        }));

      } else {
        console.log("❌ INCORRECT flag - tweet is not misinformation");
        
        const basePenalty = 5;
        const penaltyMultiplier = upgradeEffects.getMistakePenaltyReduction();
        const penaltyPoints = Math.round(basePenalty * penaltyMultiplier);

        console.log(`💸 INCORRECT FLAG PENALTY: ${penaltyPoints} points`);

        // Use GameStateManager function for incorrect flag
        gameState.handleMessageModeration(messageId, false, 0, penaltyPoints);

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

      console.log("🚩 FLAG ACTION COMPLETED");
    }

    console.log("🔥 handleModeration function completed");
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

  // Calculate missed misinformation penalties at game end using GameStateManager
  useEffect(() => {
    if (gameOver) {
      console.log("🏁 GAME OVER - Using GameStateManager to calculate missed penalties");

      // Use GameStateManager function to calculate missed misinformation
      const missedPenaltyInfo = gameState.calculateMissedMisinformationPenalty();
      
      if (missedPenaltyInfo.missedCount > 0) {
        // Update score breakdown
        setScoreBreakdown((prev) => ({
          ...prev,
          missedMisinformation: missedPenaltyInfo.missedCount,
        }));
      }

      // Get final stats from GameStateManager
      setTimeout(() => {
        const finalStats = gameState.getFinalGameStats();
        console.log("📊 Final game stats from GameStateManager:", finalStats);
      }, 100);
    }
  }, [gameOver]);

  // Save correctly handled tweets effect
  useEffect(() => {
    if (gameOver && user) {
      console.log("Tweet saving effect check - gameOver:", gameOver, "user:", user ? user.email : "no user", "allGameTweets:", allGameTweets.length);

      // Create array for ALL correctly handled tweets
      const allCorrectlyHandledTweets = [];

      // Process ALL tweets that appeared during the game
      allGameTweets.forEach((tweet) => {
        const isMisinformation = evaluateTweetContent(tweet);
        const processedTweet = processedTweets.find((p) => p.id === tweet.id);

        // Case 1: Tweet was misinformation and was correctly flagged
        if (isMisinformation && processedTweet?.wasFlagged) {
          allCorrectlyHandledTweets.push(tweet.id);
        }

        // Case 2: Tweet was NOT misinformation and was correctly NOT flagged
        if (!isMisinformation && (!processedTweet || !processedTweet.wasFlagged)) {
          allCorrectlyHandledTweets.push(tweet.id);
        }
      });

      console.log(`Total correctly handled tweets: ${allCorrectlyHandledTweets.length} out of ${allGameTweets.length}`);

      // Save all correctly handled tweets
      if (allCorrectlyHandledTweets.length > 0) {
        console.log("Saving all correctly handled tweets:", allCorrectlyHandledTweets);

        try {
          saveCorrectlyAnsweredTweets(allCorrectlyHandledTweets)
            .then((response) => console.log("All correctly handled tweets saved:", response))
            .catch((err) => console.error("Error saving correctly handled tweets:", err));
        } catch (error) {
          console.error("Error in save effect:", error);
        }
      }
    }
  }, [gameOver, user, allGameTweets, processedTweets]);

  return {
    scoreBreakdown,
    setScoreBreakdown,
    handleTweetClick,
    handleCloseModal,
    handleModeration,
  };
}