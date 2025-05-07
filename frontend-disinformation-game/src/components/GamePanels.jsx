import React from 'react';

export function LoadingState() {
  return (
    <div className="flex justify-center items-center h-64">
      <p className="text-lg text-gray-600">Loading tweets...</p>
    </div>
  );
}

// Update the GameOver function
export function GameOver({ score, messagesHandled, onPlayAgain, scoreBreakdown }) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">Game Over!</h1>
      <h2 className="mb-2 text-xl">Your final score: {score}</h2>
      <p className="mb-6 text-gray-600">You flagged {messagesHandled} tweets!</p>
      
      <div className="mb-6 border-t border-b border-gray-200 py-4">
        <h3 className="mb-2 font-bold">Score Breakdown:</h3>
        <ul className="space-y-1 text-sm">
          <li className="text-green-600">
            Correct flags: +{scoreBreakdown.correctFlags * 10} points ({scoreBreakdown.correctFlags} tweets)
          </li>
          <li className="text-red-600">
            Incorrect flags: -{scoreBreakdown.incorrectFlags * 5} points ({scoreBreakdown.incorrectFlags} tweets)
          </li>
          <li className="text-red-600">
            Missed misinformation: -{scoreBreakdown.missedMisinformation * 5} points ({scoreBreakdown.missedMisinformation} tweets)
          </li>
          <li className="text-blue-600">
            Speed bonus: +{scoreBreakdown.speedBonus} points
          </li>
        </ul>
      </div>
      
      <button
        onClick={onPlayAgain}
        className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      >
        Play Again
      </button>
    </div>
  );
}

export function TimerDisplay({ timeRemaining, feedSpeed, changeFeedSpeed, score }) {
  // Convert milliseconds to minutes and seconds
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  return (
    <div className="flex items-center space-x-4">
      <div className="rounded-full bg-blue-100 px-4 py-1 font-bold text-blue-600">
        Score: {score}
      </div>
      <div className="text-lg font-semibold">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Speed:</span>
        <select 
          value={feedSpeed}
          onChange={(e) => changeFeedSpeed(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1"
        >
          <option value={0.5}>Slow</option>
          <option value={1}>Normal</option>
          <option value={2}>Fast</option>
        </select>
      </div>
    </div>
  );
}

export function FactCheckPanel({ factCheckResult, loading, factChecksRemaining, handleModeration, currentMessageId, largerArticles }) {
  return (
    <div className="rounded-lg bg-gray-50 p-6 shadow-md h-[600px] flex flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold">Fact Check Results</h2>
        <div
          className={`text-sm ${factChecksRemaining <= 1 ? "font-bold text-red-600" : "text-gray-600"}`}
        >
          {factChecksRemaining} checks remaining
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {!factCheckResult && !loading && (
          <p className="text-gray-500 italic">
            Click "Fact Check" on a tweet to see results.
          </p>
        )}

        {loading && (
          <div className="py-3 text-center text-gray-600 italic">
            Searching for fact checks...
          </div>
        )}

        {factCheckResult && factCheckResult.type === 'news' && (
          <NewsArticles 
            articles={factCheckResult.articles}
            onModerate={handleModeration}
            messageId={currentMessageId}
            largerArticles={largerArticles}
          />
        )}

        {factCheckResult && factCheckResult.found && factCheckResult.type === 'factCheck' && (
          <FactResults
            results={factCheckResult.allResults}
            onModerate={handleModeration}
            messageId={currentMessageId}
            largerArticles={largerArticles}
          />
        )}

        {factCheckResult && !factCheckResult.found && (
          <NoResults 
            message={factCheckResult.message}
            onModerate={handleModeration}
            messageId={currentMessageId}
          />
        )}
      </div>
    </div>
  );
}

function NewsArticles({ articles, onModerate, messageId, largerArticles }) {
  return (
    <>
      <h3 className="font-bold text-lg mb-2">Related News Articles</h3>
      <div className={`mb-4 ${largerArticles ? 'max-h-[400px]' : 'max-h-60'} space-y-4 overflow-y-auto`}>
        {articles.map((article, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-sm font-semibold">{article.title}</p>
            <p className="mb-2 text-sm">{article.description}</p>
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="text-sm">
                <span className="font-medium">Source:</span>{" "}
                {article.source}
              </p>
              <p className="text-sm">
                <span className="font-medium">Published:</span>{" "}
                {new Date(article.publishedAt).toLocaleDateString()}
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Read full article →
              </a>
            </div>
          </div>
        ))}
      </div>
      <ActionButtons onModerate={onModerate} messageId={messageId} />
    </>
  );
}

function FactResults({ results, onModerate, messageId, largerArticles }) {
  return (
    <>
      <div className={`mb-4 ${largerArticles ? 'max-h-[400px]' : 'max-h-60'} space-y-4 overflow-y-auto`}>
        {results.map((result, index) => (
          <div
            key={index}
            className="rounded-md border border-gray-200 bg-white p-3"
          >
            <p className="text-sm font-semibold">
              {result.claimant || "Unknown source"}
            </p>
            <p className="mb-2 text-sm">{result.text}</p>

            {result.claimReview && result.claimReview.length > 0 && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-sm">
                  <span className="font-medium">Rating:</span>{" "}
                  <span className="font-medium text-amber-600">
                    {result.claimReview[0].textualRating}
                  </span>
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
        ))}
      </div>
      <ActionButtons onModerate={onModerate} messageId={messageId} />
    </>
  );
}

// Missing component - NoResults
function NoResults({ message, onModerate, messageId }) {
  return (
    <>
      <div className="py-6 text-center">
        <p className="mb-4 text-gray-600">{message || "No fact checks found for this claim."}</p>
        <p className="text-sm text-gray-500">
          You may need to use your own judgment for this tweet.
        </p>
      </div>
      <ActionButtons onModerate={onModerate} messageId={messageId} />
    </>
  );
}

// Missing component - ActionButtons
function ActionButtons({ onModerate, messageId }) {
  return (
    <div className="mt-4 flex gap-3">
      <button
        onClick={() => onModerate(messageId, "flag")}
        className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
      >
        {"Intox"}
      </button>
    </div>
  );
}


export default {
  LoadingState,
  GameOver,
  FactCheckPanel,
  TimerDisplay
};