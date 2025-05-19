import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useImagePreloader from "../../hooks/useImagePreloader";
import { fetchTweets, classifyTweet, deleteTweet } from "../../services/moderationService";
import { LoadingScreen, TweetDisplay, ModerationControls } from "./ModerationUI";

// Number of tweets to preload at once
const PRELOAD_BATCH_SIZE = 10;

// Custom ErrorScreen component
const CustomErrorScreen = ({ error, onRetry }) => (
  <div className="container mx-auto px-4 py-8">
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Tweet Moderation Interface</h1>
    </div>
    
    <div className="max-w-md mx-auto rounded-lg bg-red-50 p-6 text-center">
      <h2 className="mb-4 text-xl font-bold text-red-700">Message</h2>
      <p className="text-red-700">{error}</p>
      
      <div className="mt-4 flex justify-center">
        <button 
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700" 
          onClick={onRetry}
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Custom EmptyScreen component
const CustomEmptyScreen = ({ message }) => (
  <div className="container mx-auto px-4 py-8">
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Tweet Moderation Interface</h1>
    </div>
    
    <div className="text-center p-8 bg-white rounded-lg shadow-md">
      <p className="text-lg text-gray-600 mb-4">{message}</p>
      <p>Check back later for new content to moderate.</p>
    </div>
  </div>
);

function ModerationInterface() {
  const [tweets, setTweets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ reviewed: 0, marked: 0, deleted: 0 });
  const [initialPreloadDone, setInitialPreloadDone] = useState(false);
  const navigate = useNavigate();

  // Track which tweets we've already preloaded images for
  const preloadedTweetsRef = useRef(new Set());

  // Use our image preloader
  const { imagesStatus, preloadImages } = useImagePreloader();
  
  // Get current tweet (must come after tweets state declaration)
  const currentTweet = tweets[currentIndex];
  
  // Define isLoadingMedia after imagesStatus is declared
  const isLoadingMedia = imagesStatus && imagesStatus.loading && imagesStatus.total > 0;

  // Initial fetch tweets
  useEffect(() => {
    async function loadTweets() {
      try {
        setLoading(true);
        const data = await fetchTweets();
        
        // Filter for only unclassified tweets
        const unclassifiedTweets = data.filter(tweet => 
          !tweet.is_disinfo || tweet.is_disinfo === ''
        );
        
        setTweets(unclassifiedTweets);
        
        if (unclassifiedTweets.length === 0) {
          // If no unclassified tweets, show a message
          setError("No new tweets available for moderation at this time.");
        }
      } catch (err) {
        console.error("Error fetching tweets:", err);
        setError(err?.message || "Failed to fetch tweets");
      } finally {
        setLoading(false);
      }
    }
    
    loadTweets();
  }, []);
  
  // Effect to preload initial batch of tweets when first loaded
  useEffect(() => {
    if (tweets.length > 0 && !initialPreloadDone) {
      const initialBatchSize = Math.min(PRELOAD_BATCH_SIZE, tweets.length);
      const tweetsToPreload = tweets.slice(0, initialBatchSize);
      
      const allImagesToPreload = [];
      
      tweetsToPreload.forEach(tweet => {
        preloadedTweetsRef.current.add(tweet.id);
        
        if (tweet.Profile_Pic) {
          allImagesToPreload.push(tweet.Profile_Pic);
        }
        
        if (tweet.Media_Files) {
          const mediaArray = tweet.Media_Files.split('|').filter(Boolean);
          allImagesToPreload.push(...mediaArray);
        }
      });
      
      if (allImagesToPreload.length > 0) {
        preloadImages(allImagesToPreload);
      }
      
      setInitialPreloadDone(true);
    }
  }, [tweets, initialPreloadDone, preloadImages]);

  // Add navigation handlers
  const handleNext = () => {
    if (currentIndex < tweets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle classifying tweets as disinformation or not
  const handleModerate = async (isDisinfo) => {
    try {
      if (!currentTweet) return;
      
      // Call the API to update the tweet's classification
      await classifyTweet(currentTweet.id, isDisinfo);

      // Update local state
      const updatedTweets = [...tweets];
      updatedTweets.splice(currentIndex, 1); // Remove the tweet once it's moderated
      setTweets(updatedTweets);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        marked: prev.marked + (isDisinfo ? 1 : 0)
      }));

      // Adjust current index if needed
      if (currentIndex >= updatedTweets.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error('Error updating classification:', error);
      setError(error?.message || "Failed to update classification");
    }
  };

  // Handle deleting tweets
  const handleDelete = async () => {
    try {
      if (!currentTweet) return;
      
      // Call the API to delete the tweet
      await deleteTweet(currentTweet.id);

      // Remove from tweet list
      const updatedTweets = tweets.filter(tweet => tweet.id !== currentTweet.id);
      setTweets(updatedTweets);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        deleted: prev.deleted + 1
      }));

      // Adjust current index if needed
      if (currentIndex >= updatedTweets.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error('Error deleting tweet:', error);
      setError(error?.message || "Failed to delete tweet");
    }
  };

  // Show loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Show error state
  if (error) {
    return <CustomErrorScreen 
      error={error} 
      onRetry={() => window.location.reload()}
    />;
  }

  // Show empty state if no tweets
  if (!tweets || tweets.length === 0) {
    return <CustomEmptyScreen 
      message="No unmoderated tweets available at this time."
    />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tweet Moderation Interface</h1>
        <div className="text-sm">
          <span className="font-medium">Reviewed:</span> {stats.reviewed} |
          <span className="ml-2 font-medium">Marked as Disinfo:</span> {stats.marked} |
          <span className="ml-2 font-medium">Deleted:</span> {stats.deleted}
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center rounded-md bg-blue-50 p-3">
        <p className="text-sm">
          <span className="font-medium">
            Tweet {currentIndex + 1} of {tweets.length} (unmoderated only)
          </span>
          {isLoadingMedia && (
            <span className="ml-2 text-blue-600">
              Loading media ({imagesStatus.loaded}/{imagesStatus.total})...
            </span>
          )}
        </p>
        
        {/* Refresh button */}
        <button 
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {currentTweet && (
          <>
            <TweetDisplay 
              tweet={currentTweet} 
              isLoadingMedia={isLoadingMedia} 
              imagesStatus={imagesStatus}
              isClassified={false}
            />
            
            <ModerationControls
              onMarkDisinfo={() => handleModerate(true)}
              onMarkNotDisinfo={() => handleModerate(false)}
              onDelete={handleDelete}
              onPrevious={handlePrevious}
              onNext={handleNext}
              currentIndex={currentIndex}
              totalTweets={tweets.length}
              isClassified={false}
              classification=""
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ModerationInterface;