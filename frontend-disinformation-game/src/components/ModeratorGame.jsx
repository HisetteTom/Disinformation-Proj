import React, { useState, useEffect } from "react";
import { checkFact } from "../services/factCheckApi";
import { fetchTweets } from "../services/tweetApi";
import { parseTwitterDate } from "../utils/gameUtils";
import { LoadingState, GameOver, ModerationPanel, FactCheckPanel } from "./GamePanels";

function ModeratorGame() {
  const [gameMessages, setGameMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [factCheckResult, setFactCheckResult] = useState(null);
  const [score, setScore] = useState(0);
  const [messagesHandled, setMessagesHandled] = useState(0);
  const [loading, setLoading] = useState(false);
  const [factChecksRemaining, setFactChecksRemaining] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
          mediaFiles: tweet.Media_Files ? tweet.Media_Files.split('|') : []
        }));
        
        const shuffled = [...formattedTweets].sort(() => 0.5 - Math.random());
        setGameMessages(shuffled);
        setCurrentMessage(shuffled[0]);
      } catch (error) {
        console.error("Error loading tweets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTweets();
  }, []);

  const handleModeration = async (messageId, action) => {
    if (action === "factcheck") {
      if (factChecksRemaining <= 0) {
        setFactCheckResult({
          found: false,
          message: "You've used all your fact checks! Make your best judgment.",
        });
        return;
      }

      setLoading(true);
      const result = await checkFact(currentMessage.content);
      setFactCheckResult(result);
      setFactChecksRemaining(factChecksRemaining - 1);
      setLoading(false);
      return;
    }

    setFactCheckResult(null);
    setMessagesHandled(messagesHandled + 1);
    if (messagesHandled + 1 < gameMessages.length) {
      setCurrentMessage(gameMessages[messagesHandled + 1]);
    } else {
      setCurrentMessage(null);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!currentMessage) {
    return <GameOver score={score} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <ModerationPanel
        message={currentMessage}
        handleModeration={handleModeration}
        loading={loading}
        messagesHandled={messagesHandled}
        totalMessages={gameMessages.length}
        score={score}
      />
      
      <FactCheckPanel
        factCheckResult={factCheckResult}
        loading={loading}
        factChecksRemaining={factChecksRemaining}
        handleModeration={handleModeration}
        currentMessageId={currentMessage.id}
      />
    </div>
  );
}

export default ModeratorGame;