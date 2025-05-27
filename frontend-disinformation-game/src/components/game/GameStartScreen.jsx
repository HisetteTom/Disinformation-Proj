import React from "react";

function GameStartScreen({ user, onLogin, onStartGame, onStartHashtagMode }) {
  return (
    <div className="animate-fadeIn mx-auto max-w-3xl rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 text-white shadow-lg">
      <div className="mb-4 flex items-center space-x-3">
        <div className="animate-pulse text-[#4DA6FF]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white text-shadow">Twitter Moderation Challenge</h1>
      </div>
      
      {/* Single column layout - Game Description */}
      <div className="mb-5 rounded-md border-l-4 border-[#4DA6FF]/70 bg-white/10 p-3 backdrop-blur-sm">
        <p className="mb-3 text-white/90">
          In today's digital landscape, <span className="font-semibold">misinformation spreads faster than ever</span>. Your mission is to identify and flag misleading tweets before they go viral.
        </p>
        <p className="mb-3 text-white/90">
          You have <span className="font-bold text-[#4DA6FF]">3 minutes</span> to review as many tweets as possible. Correctly flag misinformation to earn points, but be careful - incorrect flags will cost you!
        </p>
        <p className="text-white/90">
          <span className="inline-flex items-center bg-[#123C6D] px-2 py-1 rounded-md mr-1 border border-[#4DA6FF]/40">
            <span className="mr-1">🔍</span>
            <span className="font-bold text-[#4DA6FF]">5 fact checks</span> 
          </span>
          are available to help with difficult decisions.
        </p>
      </div>

      {/* User Info */}
      <div className="mb-6 rounded-md bg-[#123C6D] p-4 border border-[#4DA6FF]/30">
        {user ? (
          <div className="text-white flex items-center">
            <div className="mr-3 h-8 w-8 rounded-full bg-[#4DA6FF]/20 flex items-center justify-center border border-[#4DA6FF]/30">
              <span className="text-sm font-medium text-white">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <span>Playing as: <span className="font-bold ml-1">{user.email}</span></span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-white">
              <span className="font-bold">Log in</span> to save your progress and compete on leaderboards!
            </p>
            <button 
              onClick={onLogin} 
              className="rounded bg-[#4DA6FF] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#4DA6FF]/80 transform hover:scale-105"
            >
              Login
            </button>
          </div>
        )}
      </div>

      {/* Game Mode Selection */}
      <div className="space-y-3">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-white/90 mb-2">Choose Your Challenge</h2>
          <p className="text-sm text-white/70">Select how you want to moderate content</p>
        </div>

        {/* Standard Mode Button */}
        <button
          onClick={onStartGame}
          className="w-full transform rounded-lg bg-[#4DA6FF] px-4 py-3 font-bold text-white hover:bg-[#4DA6FF]/80 transition hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="text-left">
            <div className="text-lg">Start Moderating</div>
            <div className="text-xs text-white/80 font-normal">General content across all topics</div>
          </div>
        </button>

        {/* Hashtag Mode Button */}
        <button
          onClick={onStartHashtagMode}
          className="w-full transform rounded-lg border border-[#4DA6FF]/30 bg-[#4DA6FF]/10 px-4 py-3 font-bold text-white hover:bg-[#4DA6FF]/20 hover:border-[#4DA6FF]/50 transition hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center group backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <div className="text-left">
            <div className="text-lg">Moderate by Hashtag</div>
            <div className="text-xs text-white/80 font-normal">Focus on specific topics</div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto h-4 w-4 text-[#4DA6FF] opacity-60 group-hover:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Game Mode Information */}
      <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-white/80">
            <p className="font-semibold text-yellow-400 mb-2">Game Modes:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#123C6D]/50 rounded-md p-3 border border-[#4DA6FF]/20">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#4DA6FF] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-semibold text-[#4DA6FF]">Standard Mode</span>
                </div>
                <p className="text-xs text-white/70">Moderate a variety of tweets across all topics and hashtags</p>
              </div>
              <div className="bg-[#123C6D]/50 rounded-md p-3 border border-[#4DA6FF]/20">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#4DA6FF] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span className="font-semibold text-[#4DA6FF]">Hashtag Mode</span>
                </div>
                <p className="text-xs text-white/70">Focus on specific topics by choosing a hashtag to moderate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameStartScreen;