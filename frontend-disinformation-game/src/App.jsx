import React, { useState } from "react";
import ModeratorGame from "./components/ModeratorGame";

function App() {
  // Add a key to force complete component remount between games
  const [gameKey, setGameKey] = useState(Date.now());

  // Handler for game reset
  const handleGameReset = () => {
    setGameKey(Date.now());
  };

  return (
    <div className="mx-auto max-w-4xl p-5 font-sans text-gray-800">
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-blue-600">
          Disinformation Game
        </h1>
      </header>
      <main>
        <ModeratorGame key={gameKey} onReset={handleGameReset} />
      </main>
    </div>
  );
}

export default App;