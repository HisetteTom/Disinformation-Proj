import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { onAuthChange, logout } from "./services/authService";
import AppContent from "./components/layout/AppContent";

function App() {
  const [gameKey, setGameKey] = useState(Date.now());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGameReset = () => {
    setGameKey(Date.now());
    // The setIsGameOver will now be handled in AppContent
  };

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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