import React from "react";

function GameStartScreen({ user, onLogin, onStartGame }) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 text-white shadow-lg">
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

      {/* Start Button */}
      <button
        onClick={onStartGame}
        className="w-full transform rounded-lg bg-[#4DA6FF] px-4 py-3 font-bold text-white hover:bg-[#4DA6FF]/80 transition hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start Moderating
      </button>
    </div>
  );
}

export default GameStartScreen;