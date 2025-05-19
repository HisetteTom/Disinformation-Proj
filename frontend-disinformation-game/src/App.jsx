import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import ModeratorGame from "./components/game/ModeratorGame";
import ModerationInterface from "./components/moderation/ModerationInterface";
import { getCurrentUser, onAuthChange, logout } from "./services/authService";
import AuthModal from "./components/auth/AuthModal";

// Create a wrapper component to determine the current location
function AppContent({ user, loading, handleLogout, toggleAuthModal, gameKey, handleGameReset, showAuthModal }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans text-gray-800 min-h-screen flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-blue-600">Disinformation Game</h1>
        <div className="flex items-center gap-4">
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="font-medium">Welcome, {user.email}</span>
              <button onClick={handleLogout} className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={toggleAuthModal} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Login / Sign Up
            </button>
          )}
        </div>
      </header>
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <ModeratorGame 
              key={gameKey} 
              onReset={handleGameReset} 
              user={user} 
              onLogin={toggleAuthModal} 
              onGameStateChange={(isPlaying) => setIsPlayingGame(isPlaying)}
            />
          } />
          <Route path="/admin-moderation" element={user ? <ModerationInterface user={user} /> : <Navigate to="/" />} />
        </Routes>
        
        {/* Box-style moderation link that appears only on home page when logged in AND not in a game */}
        {isHomePage && user && !isPlayingGame && (
          <div className="mt-8 mx-auto max-w-sm">
            <Link 
              to="/admin-moderation" 
              className="block w-full text-center py-3 px-4 bg-gray-100 hover:bg-gray-200 transition-colors 
                       border border-gray-300 rounded-lg shadow-sm text-gray-700"
            >
              <span className="font-medium">Access Moderation Panel</span>
            </Link>
          </div>
        )}
      </main>

      {showAuthModal && <AuthModal onClose={toggleAuthModal} />}
    </div>
  );
}

function App() {
  // Add a key to force complete component remount between games
  const [gameKey, setGameKey] = useState(Date.now());
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Handler for game reset
  const handleGameReset = () => {
    setGameKey(Date.now());
  };

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // User will be set to null by the auth state listener
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Toggle auth modal
  const toggleAuthModal = () => {
    setShowAuthModal(!showAuthModal);
  };

  return (
    <BrowserRouter>
      <AppContent 
        user={user}
        loading={loading}
        handleLogout={handleLogout}
        toggleAuthModal={toggleAuthModal}
        gameKey={gameKey}
        handleGameReset={handleGameReset}
        showAuthModal={showAuthModal}
      />
    </BrowserRouter>
  );
}

export default App;