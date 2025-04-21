import React, { useState, useEffect } from "react";
import MessageCard from "./MessageCard";
import messages from "../data/messages";
import { checkFact } from "../services/factCheckApi";

function ModeratorGame() {
  const [gameMessages, setGameMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [factCheckResult, setFactCheckResult] = useState(null);
  const [score, setScore] = useState(0);
  const [messagesHandled, setMessagesHandled] = useState(0);
  const [loading, setLoading] = useState(false);
  // New state for limited fact checks
  const [factChecksRemaining, setFactChecksRemaining] = useState(5);

  useEffect(() => {
    // Shuffle messages and load them
    const shuffled = [...messages].sort(() => 0.5 - Math.random());
    setGameMessages(shuffled);
    setCurrentMessage(shuffled[0]);
  }, []);

  // Extract key topics from a message for better API search
  const extractSearchQuery = (content) => {
    // Simple approach: extract keywords based on common misinformation topics
    const topicKeywords = {
      vaccines: ["vaccines", "autism", "vaccination", "immunization"],
      climate: ["climate change", "global warming", "hoax"],
      covid: ["covid", "coronavirus", "5g", "microchip"],
      politics: ["election fraud", "stolen election", "voter fraud"],
      health: ["cure cancer", "miracle cure", "weight loss", "belly fat"],
      conspiracy: [
        "moon landing",
        "flat earth",
        "chemtrails",
        "government conspiracy",
      ],
    };

    // Convert to lowercase for easier matching
    const lowerContent = content.toLowerCase();

    // Find matching topics
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword)) {
          // Return the first significant match we find
          return keyword;
        }
      }
    }

    // Fallback: return the first 3-5 words (usually contains the main claim)
    const words = content.split(" ");
    return words.slice(0, Math.min(5, words.length)).join(" ");
  };

  const handleModeration = async (messageId, action) => {
    if (action === "factcheck") {
      // Check if we have fact checks remaining
      if (factChecksRemaining <= 0) {
        setFactCheckResult({
          found: false,
          message: "You've used all your fact checks! Make your best judgment.",
        });
        return;
      }

      setLoading(true);
      // Use the extracted query for better results
      const searchQuery = extractSearchQuery(currentMessage.content);
      console.log("Searching for:", searchQuery);
      const result = await checkFact(searchQuery);
      setFactCheckResult(result);
      setFactChecksRemaining(factChecksRemaining - 1);
      setLoading(false);
      return;
    }

    // Clear fact check results when taking a moderation action
    setFactCheckResult(null);

    // For approve or flag actions
    const isDisinformation = Math.random() > 0.5; // In a real game, this would be predetermined

    // Score based on correct moderation
    if (
      (isDisinformation && action === "flag") ||
      (!isDisinformation && action === "approve")
    ) {
      setScore(score + 10);
    } else {
      setScore(Math.max(0, score - 5));
    }

    // Move to next message
    setMessagesHandled(messagesHandled + 1);
    if (messagesHandled + 1 < gameMessages.length) {
      setCurrentMessage(gameMessages[messagesHandled + 1]);
    } else {
      setCurrentMessage(null); // Game over
    }
  };

  // Helper function to determine if a claim is likely misinformation based on ratings
  const isMisinfo = (result) => {
    if (!result.claimReview || !result.claimReview.length) return false;

    const rating = result.claimReview[0].textualRating.toLowerCase();
    const misinfoTerms = [
      "false",
      "pants on fire",
      "fake",
      "incorrect",
      "misleading",
      "mostly false",
      "untrue",
      "not true",
      "fiction",
      "deceptive",
      "misinformation",
      "hoax",
    ];

    return misinfoTerms.some((term) => rating.includes(term));
  };

  if (!currentMessage) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Game Over!</h1>
        <h2 className="mb-6 text-xl">Your final score: {score}</h2>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Main moderation panel */}
      <div className="rounded-lg bg-gray-50 p-6 shadow-md md:col-span-2">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
          <h1 className="text-2xl font-bold">Social Media Moderator</h1>
          <div className="rounded-full bg-blue-100 px-4 py-1 font-bold text-blue-600">
            Score: {score}
          </div>
        </div>

        <div className="mb-6">
          <MessageCard message={currentMessage} onModerate={handleModeration} />
        </div>

        {loading && (
          <div className="py-3 text-center text-gray-600 italic">
            Checking facts...
          </div>
        )}

        <div className="text-right text-sm text-gray-500">
          <p>
            Messages moderated: {messagesHandled} / {gameMessages.length}
          </p>
        </div>
      </div>

      {/* Fact check results panel */}
      <div className="rounded-lg bg-gray-50 p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
          <h2 className="text-xl font-bold">Fact Check Results</h2>
          <div
            className={`text-sm ${factChecksRemaining <= 1 ? "font-bold text-red-600" : "text-gray-600"}`}
          >
            {factChecksRemaining} checks remaining
          </div>
        </div>

        {!factCheckResult && !loading && (
          <p className="text-gray-500 italic">
            Click "Fact Check" on the message to see results here
          </p>
        )}

        {loading && (
          <div className="py-3 text-center text-gray-600 italic">
            Searching for fact checks...
          </div>
        )}

        {factCheckResult && factCheckResult.found && (
          <>
            <div className="mb-4 max-h-60 space-y-4 overflow-y-auto">
              {factCheckResult.allResults.map((result, index) => {
                const isLikelyMisinfo = isMisinfo(result);
                return (
                  <div
                    key={index}
                    className={`rounded-md border ${isLikelyMisinfo ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"} p-3`}
                  >
                    <p className="text-sm font-semibold">
                      {result.claimant || "Unknown source"}
                    </p>
                    <p className="mb-2 text-sm">{result.text}</p>

                    {result.claimReview && result.claimReview.length > 0 && (
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <p className="text-sm">
                          <span className="font-medium">Rating:</span>{" "}
                          <span
                            className={`font-medium ${isLikelyMisinfo ? "text-red-600" : "text-amber-600"}`}
                          >
                            {result.claimReview[0].textualRating}
                          </span>
                          {isLikelyMisinfo && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                              Likely Misinfo
                            </span>
                          )}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">By:</span>{" "}
                          {result.claimReview[0].publisher?.name ||
                            "Unknown publisher"}
                        </p>
                        <a
                          href={result.claimReview[0].url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View fact check →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleModeration(currentMessage.id, "approve")}
                className="rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
              >
                Approve Message
              </button>
              <button
                onClick={() => handleModeration(currentMessage.id, "flag")}
                className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              >
                Flag as Misinfo
              </button>
            </div>
          </>
        )}

        {factCheckResult && !factCheckResult.found && (
          <div>
            <p className="mb-4 text-gray-600">{factCheckResult.message}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleModeration(currentMessage.id, "approve")}
                className="rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
              >
                Approve Message
              </button>
              <button
                onClick={() => handleModeration(currentMessage.id, "flag")}
                className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              >
                Flag as Misinfo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModeratorGame;
