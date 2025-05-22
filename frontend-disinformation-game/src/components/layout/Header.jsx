import React from "react";
import { Link } from "react-router-dom";

function Header({ user, timeLeft, liveScore, formatTime, isVisible, handleLogout, toggleAuthModal }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0a1f38]/95 via-[#123C6D]/95 to-[#1a4b82]/95 backdrop-blur shadow-lg animate-fadeIn">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and site name */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="animate-pulse">
              <img src="/img/logo_game.png" alt="DisInfo Game Logo" className="h-10 w-10" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white text-shadow transition-all group-hover:text-[#4DA6FF]">DisInfo Game</span>
          </Link>
          
          {/* Center - Game stats */}
          {isVisible && (
            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform space-x-6 md:flex">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-[#0a1f38]/70 p-1.5 border border-[#4DA6FF]/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-white">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-[#0a1f38]/70 p-1.5 border border-[#4DA6FF]/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-white">${liveScore}</span>
              </div>
            </div>
          )}
          
          {/* Right - User section */}
          <div className="flex items-center">
            {/* Mobile game stats */}
            {isVisible && (
              <div className="flex md:hidden space-x-3 mr-3">
                <div className="flex items-center justify-center">
                  <span className="text-xs font-medium text-white bg-[#4DA6FF]/20 px-2 py-0.5 rounded-md border border-[#4DA6FF]/30">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-xs font-medium text-white bg-[#4DA6FF]/20 px-2 py-0.5 rounded-md border border-[#4DA6FF]/30">
                    ${liveScore}
                  </span>
                </div>
              </div>
            )}
            
            {/* User/Auth */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:block">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-[#4DA6FF]/20 flex items-center justify-center border border-[#4DA6FF]/30">
                      <span className="text-sm font-medium text-white">
                        {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white hidden lg:inline-block">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-[#4DA6FF]/20 px-3 py-1.5 text-sm text-white hover:bg-[#4DA6FF]/30 transition transform hover:scale-105 border border-[#4DA6FF]/30 flex items-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={toggleAuthModal}
                className="rounded-md bg-[#4DA6FF] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#4DA6FF]/80 transition transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-1 animate-fadeIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;