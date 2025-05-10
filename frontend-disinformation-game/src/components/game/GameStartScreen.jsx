import React from "react";

function GameStartScreen({ user, onLogin, onStartGame }) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">Twitter Moderation Challenge</h1>
      <p className="mb-4">You'll have 3 minutes to flag as many misinformation tweets as possible. Click on tweets to examine them more closely and flag misinformation! You have 5 fact checks available to help you make decisions.</p>

      {/* Show user status */}
      <div className="mb-4 rounded-md bg-blue-50 p-3">
        {user ? (
          <p className="text-blue-800">
            Playing as: <span className="font-bold">{user.email}</span>
            {/* Your stats will be saved at the end of the game. */}
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-blue-800">
              Playing as <span className="font-semibold">Guest</span> - your progress won't be saved.
            </p>
            <button onClick={onLogin} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
              Log in
            </button>
          </div>
        )}
      </div>

      <button onClick={onStartGame} className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
        Start Game
      </button>
    </div>
  );
}

export default GameStartScreen;
