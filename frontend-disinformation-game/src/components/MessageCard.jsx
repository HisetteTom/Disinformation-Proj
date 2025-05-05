import React from "react";

function formatTweetContent(content) {
  if (!content) return '';

  // remove les t.co URLs
  const urlRegex = /https?:\/\/t\.co\/\w+/g;
  return content.replace(urlRegex, '');
}

function MessageCard({ message, onModerate, hideApproveButton, hideButtons, clickable }) {
  const mediaFiles = message.mediaFiles || [];
  
  return (
    <div className={`rounded-lg border border-gray-300 bg-white p-4 shadow-sm ${clickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          {message.profilePic && (
            <img 
              src={`http://localhost:3001/${message.profilePic}`} 
              alt={`${message.author}'s profile`}
              className="mr-2 h-8 w-8 rounded-full"
            />
          )}
          <span className="font-bold text-gray-800">@{message.author}</span>
        </div>
        <span className="text-sm text-gray-500">
          {message.timestamp instanceof Date && !isNaN(message.timestamp) 
            ? message.timestamp.toLocaleString() 
            : 'Unknown date'}
        </span>
      </div>
      
      <div 
        className="mb-4 py-2 text-gray-800"
        dangerouslySetInnerHTML={{ __html: formatTweetContent(message.content) }}
      />
      
      {/* Display media files if available */}
      {mediaFiles.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {mediaFiles.map((mediaPath, index) => (
            <img 
              key={index}
              src={`http://localhost:3001/${mediaPath}`}
              alt={`Tweet media ${index + 1}`}
              className="w-full rounded-md"
            />
          ))}
        </div>
      )}
      
      <div className="mb-4 flex gap-4 text-sm text-gray-600">
        <span>❤️ {message.likes}</span>
        <span>🔄 {message.shares}</span>
      </div>
      
      {/* Only show buttons if not explicitly hidden */}
      {!hideButtons && (
        <div className="flex flex-wrap gap-2">
          {!hideApproveButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onModerate(message.id, "approve");
              }}
              className="rounded bg-green-600 px-3 py-1 text-white transition hover:bg-green-700"
            >
              Approve
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onModerate(message.id, "flag");
            }}
            className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700"
          >
            Intox
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onModerate(message.id, "factcheck");
            }}
            className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700"
          >
            Fact Check
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageCard;