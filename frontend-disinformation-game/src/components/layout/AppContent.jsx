import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import ModeratorGame from "../game/ModeratorGame";
import ModerationInterface from "../moderation/ModerationInterface";
import AuthModal from "../auth/AuthModal";
import Header from "./Header";
import Background from "./Background";
import AnimatedStyles from "./AnimatedStyles";
import Leaderboard from "./Leaderboard";

function AppContent({ user, loading, handleLogout, toggleAuthModal, gameKey, handleGameReset, showAuthModal }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalMoney, setTotalMoney] = useState(0);

  const formatTime = (ms) => {
    const min = Math.floor(Number(ms) / 60000)
      .toString()
      .padStart(2, "0");
    const sec = Math.floor((Number(ms) % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  };

  // Modified game reset handler that ensures proper state reset
  const handleFullGameReset = () => {
    // First call the original reset function to update the game key
    handleGameReset();

    // Then explicitly reset the game state flags to show the moderation panel
    setIsPlayingGame(false);
    setIsGameOver(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Animated Background */}
      <Background />

      {/* Header */}
      <Header user={user} timeLeft={timeLeft} liveScore={totalMoney} formatTime={formatTime} isVisible={isPlayingGame} handleLogout={handleLogout} toggleAuthModal={toggleAuthModal} />

      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-8">
        {/* Main content box */}
        <div className="animate-fadeIn mb-8 w-full max-w-7xl transform rounded-2xl border border-[#4DA6FF]/20 bg-[#123C6D]/80 p-8 text-white shadow-xl backdrop-blur-md transition-all duration-500">
          <header className="mb-6 flex items-center justify-between">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4DA6FF] border-t-transparent"></div>
                <span className="text-sm text-gray-300">Loading...</span>
              </div>
            ) : !user ? (
              <button onClick={toggleAuthModal} className="focus:ring-opacity-50 animate-slideIn transform rounded bg-[#4DA6FF] px-4 py-2 text-sm font-medium transition hover:scale-105 hover:bg-blue-400 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login / Sign Up
                </span>
              </button>
            ) : null}
          </header>

          <main className="rounded-xl bg-transparent p-6 text-gray-900 shadow-none">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className={`${isHomePage && user && !isPlayingGame && !isGameOver ? "lg:w-2/3" : "w-full"}`}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ModeratorGame
                        key={gameKey}
                        onReset={handleFullGameReset}
                        user={user}
                        onLogin={toggleAuthModal}
                        onGameStateChange={(isPlaying, gameOver) => {
                          setIsPlayingGame(isPlaying);
                          setIsGameOver(gameOver);
                        }}
                        setLiveScore={setTotalMoney}
                        setTimeLeft={setTimeLeft}
                      />
                    }
                  />
                  <Route path="/admin-moderation" element={user ? <ModerationInterface user={user} /> : <Navigate to="/" />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                </Routes>
              </div>

              {isHomePage && user && !isPlayingGame && !isGameOver && (
                <div className="animate-fadeInUp flex flex-col gap-6 lg:w-1/3">
                  {/* Moderation Panel */}
                  <div className="rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 text-white shadow-lg">
                    <div className="mb-4 flex items-center space-x-3">
                      <div className="animate-pulse text-[#4DA6FF]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold">Moderation Panel</h3>
                    </div>

                    <div className="mb-4 rounded-md border-l-4 border-[#4DA6FF]/70 bg-white/10 p-3 backdrop-blur-sm">
                      <p className="text-sm text-white/90">Help us add more messages to the game by reviewing them!</p>
                    </div>

                    <Link to="/admin-moderation" className="block w-full transform rounded-lg bg-[#4DA6FF] px-4 py-3 text-center font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#4DA6FF]/80 hover:shadow-lg">
                      <span className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Access Moderation Panel
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Global leaderboard that always appears below the main content */}
        <div className="animate-fadeIn w-full max-w-7xl mt-20">
          <Leaderboard currentUserId={user?.uid} />
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={toggleAuthModal} />}

      {/* Add animated CSS */}
      <AnimatedStyles />
    </div>
  );
}

export default AppContent;
