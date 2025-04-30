import React from "react";

function MessageCard({ message, onModerate }) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      <div className="mb-2 flex justify-between">
        <span className="font-bold text-gray-800">@{message.author}</span>
        <span className="text-sm text-gray-500">
          {new Date(message.timestamp).toLocaleString()}
        </span>
      </div>
      <div className="mb-4 py-2 text-gray-800">{message.content}</div>
      <div className="mb-4 flex gap-4 text-sm text-gray-600">
        <span>❤️ {message.likes}</span>
        <span>🔄 {message.shares}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onModerate(message.id, "approve")}
          className="rounded bg-green-600 px-3 py-1 text-white transition hover:bg-green-700"
        >
          Approve
        </button>
        <button
          onClick={() => onModerate(message.id, "flag")}
          className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700"
        >
          Intox
        </button>
        <button
          onClick={() => onModerate(message.id, "factcheck")}
          className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700"
        >
          Fact Check
        </button>
      </div>
    </div>
  );
}

export default MessageCard;
