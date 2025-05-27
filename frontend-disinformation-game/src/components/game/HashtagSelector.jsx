import React, { useState, useEffect } from "react";
import { fetchHashtagStats } from "../../services/tweetApi";

function HashtagSelector({ onSelectHashtag, onBack }) {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHashtags = async () => {
      try {
        setLoading(true);
        const hashtagData = await fetchHashtagStats();
        setHashtags(hashtagData);
      } catch (err) {
        console.error("Error loading hashtags:", err);
        setError("Failed to load hashtags");
      } finally {
        setLoading(false);
      }
    };

    loadHashtags();
  }, []);

  if (loading) {
    return (
      <div className="animate-fadeIn mx-auto max-w-4xl rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-8 shadow-lg">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4DA6FF] border-t-transparent"></div>
          <p className="ml-4 text-lg text-white">Loading hashtags...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fadeIn mx-auto max-w-4xl rounded-lg border border-red-500/30 bg-gradient-to-r from-red-900/90 to-red-800/90 p-8 shadow-lg">
        <div className="text-center">
          <p className="text-lg text-white">{error}</p>
          <button
            onClick={onBack}
            className="mt-4 rounded-lg bg-[#4DA6FF] px-6 py-3 font-bold text-white transition hover:bg-[#4DA6FF]/80"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn mx-auto max-w-4xl rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-8 shadow-lg">
      <div className="mb-6 text-center">
        <div className="mb-4 inline-block rounded-full border border-[#4DA6FF]/40 bg-[#4DA6FF]/20 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </div>
        <h1 className="text-shadow text-3xl font-bold text-white">Choose a Hashtag</h1>
        <p className="mt-2 text-white/80">Select a hashtag to moderate tweets containing that topic</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hashtags.map(({ hashtag, count }) => (
          <button
            key={hashtag}
            onClick={() => onSelectHashtag(hashtag)}
            className="group flex transform items-center justify-between rounded-lg border border-[#4DA6FF]/30 bg-[#123C6D]/50 p-4 text-left transition hover:scale-105 hover:border-[#4DA6FF]/50 hover:bg-[#123C6D]/70 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-[#4DA6FF]/20 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-white">#{hashtag}</p>
                <p className="text-sm text-white/70">{count} tweets</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4DA6FF] opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="flex items-center rounded-lg border border-[#4DA6FF]/30 bg-transparent px-6 py-3 font-bold text-white transition hover:bg-[#4DA6FF]/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Menu
        </button>
      </div>
    </div>
  );
}

export default HashtagSelector;