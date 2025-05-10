import React, { useState, useEffect } from "react";
import ModeratorGame from "./components/game/ModeratorGame"; // Updated path
import { getCurrentUser, onAuthChange, logout } from "./services/authService";
import AuthModal from "./components/auth/AuthModal"; // Updated path

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
    <div className="mx-auto max-w-4xl p-5 font-sans text-gray-800">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-blue-600">Disinformation Game</h1>
        <div>
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
      <main>
        <ModeratorGame key={gameKey} onReset={handleGameReset} user={user} onLogin={toggleAuthModal} />
      </main>

      {showAuthModal && <AuthModal onClose={toggleAuthModal} />}
    </div>
  );
}

export default App;
