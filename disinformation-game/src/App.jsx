import React from "react";
import ModeratorGame from "./components/ModeratorGame";

function App() {
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans text-gray-800">
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-blue-600">
          Disinformation Game
        </h1>
      </header>
      <main>
        <ModeratorGame />
      </main>
    </div>
  );
}

export default App;
