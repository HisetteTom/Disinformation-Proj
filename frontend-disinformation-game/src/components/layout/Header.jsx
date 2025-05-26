import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { resetUserProfile } from "../../services/authService";

function Header({ user, timeLeft, liveScore, formatTime, isVisible, handleLogout, toggleAuthModal }) {
  const [totalMoney, setTotalMoney] = useState(0);
  const [userBaseMoney, setUserBaseMoney] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Fetch user's base money from profile when user changes
  useEffect(() => {
    const fetchUserMoney = async () => {
      if (!user) {
        setUserBaseMoney(0);
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/api/protected/profile", {
          headers: {
            Authorization: `Bearer ${user.stsTokenManager.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        if (data.user && typeof data.user.money !== "undefined") {
          setUserBaseMoney(data.user.money);
        } else {
          setUserBaseMoney(0);
        }
      } catch (error) {
        console.error("Error fetching user money:", error);
        setUserBaseMoney(0);
      }
    };

    fetchUserMoney();
  }, [user]);

  // Calculate total money whenever base money or live score changes
  useEffect(() => {
    const baseMoney = userBaseMoney || 0;
    const gameScore = liveScore || 0;
    setTotalMoney(baseMoney + gameScore);
  }, [userBaseMoney, liveScore]);
  
  // Format the money with $ symbol and commas
  const formattedMoney = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(totalMoney).replace('$', '');

  // Handle profile reset confirmation
  const handleResetConfirm = async () => {
    if (!user) return;
    
    try {
      setIsResetting(true);
      await resetUserProfile();
      
      // Reset local state
      setUserBaseMoney(0);
      setTotalMoney(0);
      
      // Close modal
      setShowResetModal(false);
      
      // Reload the page to refresh all components
      window.location.reload();
    } catch (error) {
      console.error("Error resetting profile:", error);
      alert("Failed to reset profile. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // Reset Modal Component
  const ResetModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowResetModal(false)}>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-gradient-to-r from-[#123C6D]/95 to-[#1a4b82]/95 border border-red-500/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-red-600/20 border-b border-red-500/30 p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/30 border border-red-500/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Reset Profile</h3>
              <p className="text-red-200/80">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="mb-4 text-white/90">
              Are you sure you want to reset your profile? This will permanently:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset your money to $0
              </li>
              <li className="flex items-center text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove all purchased upgrades
              </li>
              <li className="flex items-center text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear your game progress history
              </li>
            </ul>
          </div>

          {/* Current Stats */}
          <div className="mb-6 rounded-lg border border-[#4DA6FF]/30 bg-[#123C6D]/50 p-4">
            <h4 className="mb-2 font-medium text-white">Current Stats:</h4>
            <div className="text-sm text-white/80">
              <p>Money: ${formattedMoney}</p>
              <p>Email: {user?.email}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 rounded-lg bg-gray-600/50 px-4 py-3 font-medium text-white transition hover:bg-gray-600/70 border border-gray-500/30"
              disabled={isResetting}
            >
              Cancel
            </button>
            <button
              onClick={handleResetConfirm}
              disabled={isResetting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isResetting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
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
                  <span className="font-medium text-white">{formatTime ? formatTime(timeLeft) : "00:00"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-[#0a1f38]/70 p-1.5 border border-[#4DA6FF]/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-white">
                    ${formattedMoney}
                    {liveScore > 0 && (
                      <span className="text-green-400 ml-1 text-xs">
                        (+{liveScore})
                      </span>
                    )}
                  </span>
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
                      {formatTime ? formatTime(timeLeft) : "00:00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-xs font-medium text-white bg-[#4DA6FF]/20 px-2 py-0.5 rounded-md border border-[#4DA6FF]/30">
                      ${formattedMoney}
                      {liveScore > 0 && (
                        <span className="text-green-400 ml-1">
                          (+{liveScore})
                        </span>
                      )}
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
                  
                  {/* Reset Profile Button */}
                  <button
                    onClick={() => setShowResetModal(true)}
                    disabled={isResetting}
                    className="rounded-md bg-red-600/20 px-3 py-1.5 text-sm text-white hover:bg-red-600/30 transition transform hover:scale-105 border border-red-600/30 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reset Profile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Reset</span>
                  </button>

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

      {/* Reset Confirmation Modal */}
      {showResetModal && <ResetModal />}
    </>
  );
}

export default Header;