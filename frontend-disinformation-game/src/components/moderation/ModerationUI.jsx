import React from "react";
import MessageCard from "../tweets/MessageCard";

/**
 * Loading screen component
 */
export const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <p className="text-lg">Loading tweets...</p>
    </div>
  </div>
);

/**
 * Error screen component
 * @param {Object} props - Component props
 * @param {string} props.error - The error message
 * @param {Function} props.onRetry - Retry function
 */
export const ErrorScreen = ({ error, onRetry }) => (
  <div className="flex h-screen items-center justify-center">
    <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
      <h2 className="mb-4 text-xl font-bold text-red-700">Error</h2>
      <p className="text-red-700">{error}</p>
      <button className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700" onClick={onRetry}>
        Try Again
      </button>
    </div>
  </div>
);

/**
 * Empty tweets screen component
 * @param {Object} props - Component props
 * @param {Function} props.onNavigateHome - Navigate home function
 */
export const EmptyScreen = ({ onNavigateHome }) => (
  <div className="flex h-screen items-center justify-center">
    <div className="max-w-md rounded-lg bg-blue-50 p-6 text-center">
      <h2 className="mb-4 text-xl font-bold">No Tweets Available</h2>
      <p>There are no more tweets to moderate.</p>
      <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={onNavigateHome}>
        Return Home
      </button>
    </div>
  </div>
);

/**
 * Tweet display component
 * @param {Object} props - Component props
 * @param {Object} props.tweet - The tweet data
 * @param {boolean} props.isLoadingMedia - Whether media is loading
 * @param {Object} props.imagesStatus - Image loading status
 * @param {boolean} props.isClassified - Whether the tweet is already classified
 */
export const TweetDisplay = ({ tweet, isLoadingMedia, imagesStatus, isClassified }) => (
  <div className="relative rounded-lg border bg-white p-6 shadow-md">
    {isLoadingMedia && (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
        <div className="flex flex-col items-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p>
            Loading media ({imagesStatus.loaded}/{imagesStatus.total})
          </p>
        </div>
      </div>
    )}
    
    {/* Add classification badge for classified tweets */}
    {isClassified && (
      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium ${
        tweet.is_disinfo === 'true' 
          ? 'bg-red-100 text-red-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {tweet.is_disinfo === 'true' ? 'Disinformation' : 'Not Disinformation'}
      </div>
    )}

    {tweet && (
      <>
        <div className="mb-4">
          <MessageCard
            message={{
              id: tweet.id,
              author: tweet.Username,
              content: tweet.Text,
              timestamp: new Date(tweet.Created_At),
              likes: tweet.Likes,
              shares: tweet.Retweets,
              profilePic: tweet.Profile_Pic,
              mediaFiles: tweet.Media_Files ? tweet.Media_Files.split("|") : [],
            }}
            hideButtons={true}
          />
        </div>

        <div className="mb-4">
          <h3 className="mb-2 font-semibold">Additional Information:</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <span className="font-medium">Tweet ID:</span> {tweet.id}
            </li>
            <li>
              <span className="font-medium">Created:</span> {tweet.Created_At}
            </li>
            <li>
              <span className="font-medium">Links:</span> {tweet.T_co_Links || "None"}
            </li>
            <li>
              <span className="font-medium">Hashtags:</span> {tweet.Hashtags || "None"}
            </li>
            {/* Highlight classification status with color */}
            <li className={isClassified ? (tweet.is_disinfo === 'true' ? 'text-red-600' : 'text-green-600') : ''}>
              <span className="font-medium">Classification:</span>{" "}
              {tweet.is_disinfo === "true" ? "Disinformation" : 
               tweet.is_disinfo === "false" ? "Not Disinformation" : 
               "Unclassified"}
            </li>
          </ul>
        </div>
      </>
    )}
  </div>
);

/**
 * Moderation controls component
 * @param {Object} props - Component props
 * @param {Function} props.onMarkDisinfo - Mark as disinfo function
 * @param {Function} props.onMarkNotDisinfo - Mark as not disinfo function
 * @param {Function} props.onDelete - Delete tweet function
 * @param {Function} props.onPrevious - Go to previous tweet function
 * @param {Function} props.onNext - Go to next tweet function
 * @param {number} props.currentIndex - Current tweet index
 * @param {number} props.totalTweets - Total number of tweets
 * @param {boolean} props.isClassified - Whether the tweet is already classified
 * @param {string} props.classification - The current classification value
 */
export const ModerationControls = ({ 
  onMarkDisinfo, 
  onMarkNotDisinfo, 
  onDelete, 
  onPrevious, 
  onNext, 
  currentIndex, 
  totalTweets,
  isClassified,
  classification
}) => (
  <div>
    <div className="rounded-lg border bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-bold">Moderation Actions</h2>
      
      {/* Display different UI for classified tweets */}
      {isClassified ? (
        <div className="mb-6">
          <div className={`p-3 rounded ${classification === 'true' ? 'bg-red-100' : 'bg-green-100'}`}>
            <p className="text-center text-lg">
              This tweet is already classified as{" "}
              <span className={`font-bold ${classification === 'true' ? 'text-red-700' : 'text-green-700'}`}>
                {classification === 'true' ? 'Disinformation' : 'Not Disinformation'}
              </span>
            </p>
            <p className="text-center mt-2 text-sm text-gray-600">
              You can reclassify or delete this tweet if needed
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-gray-600">Review the tweet and select an appropriate action:</p>
      )}

      <div className="flex flex-col gap-4">
        <button 
          onClick={onMarkDisinfo} 
          className={`rounded-md px-4 py-3 font-medium text-white ${
            isClassified && classification === 'true'
              ? 'bg-red-400' // Already classified as disinfo
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isClassified && classification === 'true' 
            ? 'Already Marked as Disinformation' 
            : 'Mark as Disinformation'}
        </button>

        <button 
          onClick={onMarkNotDisinfo} 
          className={`rounded-md px-4 py-3 font-medium text-white ${
            isClassified && classification === 'false'
              ? 'bg-green-400' // Already classified as not disinfo
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isClassified && classification === 'false' 
            ? 'Already Marked as Not Disinformation' 
            : 'Mark as Not Disinformation'}
        </button>

        <button onClick={onDelete} className="rounded-md bg-gray-800 px-4 py-3 font-medium text-white hover:bg-gray-900">
          DELETE Tweet & Associated Media
        </button>
      </div>
    </div>

    <div className="mt-4 flex justify-between">
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className={`rounded-md px-4 py-2 font-medium ${
          currentIndex === 0 ? "cursor-not-allowed bg-gray-300 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        Previous Tweet
      </button>

      <button
        onClick={onNext}
        disabled={currentIndex === totalTweets - 1}
        className={`rounded-md px-4 py-2 font-medium ${
          currentIndex === totalTweets - 1 ? "cursor-not-allowed bg-gray-300 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        Next Tweet
      </button>
    </div>
  </div>
);