import React from "react";
import ModeratorGame from "./components/ModeratorGame";

function App() {
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans text-gray-800">
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-blue-600">
          Disinformation Game
        </h1>
        <p className="text-xl text-gray-600">
          Put your moderation skills to the test!
        </p>
      </header>
      <main>
        <ModeratorGame />
      </main>
      <footer className="mt-10 border-t border-gray-200 pt-5 text-center text-sm text-gray-500">
        <p>Social Media Moderation Simulator &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;
