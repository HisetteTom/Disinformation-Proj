import React, { useState } from "react";
import MenuUpgrade from "../shop/MenuUpgrade";

export function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-lg text-gray-600">Loading tweets...</p>
    </div>
  );
}

// Update the GameOver component to include onProfileUpdate in its parameters
export function GameOver({ score, messagesHandled, onPlayAgain, scoreBreakdown, timeScore, user, authUser, onProfileUpdate }) {
  var [shop, setShop] = useState(false);

  return (
    <div className="animate-fadeIn mx-auto max-w-2xl rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 shadow-lg">
      <div className="mb-6 text-center">
        <div className="mb-2 inline-block rounded-full border border-[#4DA6FF]/40 bg-[#4DA6FF]/20 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-shadow text-3xl font-bold text-white">Game Over!</h1>
        <h2 className="mb-2 text-xl font-bold text-[#4DA6FF]">${score}</h2>
        <p className="mb-2 text-white/80">
          <span className="mr-1 inline-flex items-center rounded-md border border-[#4DA6FF]/40 bg-[#123C6D] px-2 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
            {messagesHandled} tweets flagged
          </span>
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-[#4DA6FF]/20 bg-[#123C6D]/50 p-4">
        <h3 className="mb-3 flex items-center font-bold text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Score Breakdown:
        </h3>
        <ul className="space-y-2 text-sm">
          {scoreBreakdown.correctFlags > 0 && (
            <li className="flex items-center rounded-md border border-green-600/30 bg-green-600/20 px-2 py-1 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Correct flags: +{scoreBreakdown.correctFlags * 10} points ({scoreBreakdown.correctFlags} tweets)
            </li>
          )}

          {scoreBreakdown.incorrectFlags > 0 && (
            <li className="flex items-center rounded-md border border-red-600/30 bg-red-600/20 px-2 py-1 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Incorrect flags: -{scoreBreakdown.incorrectFlags * 5} points ({scoreBreakdown.incorrectFlags} tweets)
            </li>
          )}

          {scoreBreakdown.missedMisinformation > 0 && (
            <li className="flex items-center rounded-md border border-red-600/30 bg-red-600/20 px-2 py-1 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Missed misinformation: -{scoreBreakdown.missedMisinformation * 5} points ({scoreBreakdown.missedMisinformation} tweets)
            </li>
          )}

          {scoreBreakdown.speedBonus > 0 && (
            <li className="flex items-center rounded-md border border-blue-600/30 bg-blue-600/20 px-2 py-1 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Speed bonus: +{scoreBreakdown.speedBonus} points
            </li>
          )}

          {timeScore > 0 && (
            <li className="flex items-center rounded-md border border-blue-600/30 bg-blue-600/20 px-2 py-1 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time bonus: +{timeScore} points
            </li>
          )}
        </ul>
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={onPlayAgain} className="flex transform items-center rounded-full bg-gradient-to-r from-[#4DA6FF] to-[#123C6D] px-5 py-3 font-bold text-white transition hover:scale-105 hover:shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </button>
        <button onClick={() => setShop(true)} className="flex transform items-center rounded-full bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 font-bold text-white transition hover:scale-105 hover:shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upgrade Shop
        </button>
      </div>
      {shop && <MenuUpgrade user={authUser} userProfile={user} Score={score} Diplay={() => setShop(false)} onProfileUpdate={onProfileUpdate} />}
    </div>
  );
}

export function TimerDisplay({ timeRemaining, feedSpeed, changeFeedSpeed }) {
  // Convert milliseconds to minutes and seconds
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Speed:</span>
        <select value={feedSpeed} onChange={(e) => changeFeedSpeed(Number(e.target.value))} className="rounded border border-gray-300 px-2 py-1">
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
    <div className="flex h-[600px] flex-col rounded-lg bg-gray-50 p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold">Fact Check Results</h2>
        <div className={`text-sm ${factChecksRemaining <= 1 ? "font-bold text-red-600" : "text-gray-600"}`}>{factChecksRemaining} checks remaining</div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {!factCheckResult && !loading && <p className="text-gray-500 italic">Click "Fact Check" on a tweet to see results.</p>}

        {loading && <div className="py-3 text-center text-gray-600 italic">Searching for fact checks...</div>}

        {factCheckResult && factCheckResult.type === "news" && <NewsArticles articles={factCheckResult.articles} onModerate={handleModeration} messageId={currentMessageId} largerArticles={largerArticles} />}

        {factCheckResult && factCheckResult.found && factCheckResult.type === "factCheck" && <FactResults results={factCheckResult.allResults} onModerate={handleModeration} messageId={currentMessageId} largerArticles={largerArticles} />}

        {factCheckResult && !factCheckResult.found && <NoResults message={factCheckResult.message} onModerate={handleModeration} messageId={currentMessageId} />}
      </div>
    </div>
  );
}

function NewsArticles({ articles, onModerate, messageId, largerArticles }) {
  return (
    <>
      <h3 className="mb-2 text-lg font-bold">Related News Articles</h3>
      <div className={`mb-4 ${largerArticles ? "max-h-[400px]" : "max-h-60"} space-y-4 overflow-y-auto`}>
        {articles.map((article, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-sm font-semibold">{article.title}</p>
            <p className="mb-2 text-sm">{article.description}</p>
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="text-sm">
                <span className="font-medium">Source:</span> {article.source}
              </p>
              <p className="text-sm">
                <span className="font-medium">Published:</span> {new Date(article.publishedAt).toLocaleDateString()}
              </p>
              <a href={article.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
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
      <div className={`mb-4 ${largerArticles ? "max-h-[400px]" : "max-h-60"} space-y-4 overflow-y-auto`}>
        {results.map((result, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-sm font-semibold">{result.claimant || "Unknown source"}</p>
            <p className="mb-2 text-sm">{result.text}</p>

            {result.claimReview && result.claimReview.length > 0 && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-sm">
                  <span className="font-medium">Rating:</span> <span className="font-medium text-amber-600">{result.claimReview[0].textualRating}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">By:</span> {result.claimReview[0].publisher?.name || "Unknown publisher"}
                </p>
                <a href={result.claimReview[0].url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
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
        <p className="text-sm text-gray-500">You may need to use your own judgment for this tweet.</p>
      </div>
      <ActionButtons onModerate={onModerate} messageId={messageId} />
    </>
  );
}

export function GameLoadingState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <p className="text-lg text-gray-600">Preparing your game...</p>
      <p className="mt-2 text-sm text-gray-500">The first tweets will appear momentarily</p>
    </div>
  );
}

function ActionButtons({ onModerate, messageId }) {
  return (
    <div className="mt-4 flex gap-3">
      <button onClick={() => onModerate(messageId, "flag")} className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700">
        {"Intox"}
      </button>
    </div>
  );
}

export default {
  LoadingState,
  GameLoadingState,
  GameOver,
  FactCheckPanel,
  TimerDisplay,
};
