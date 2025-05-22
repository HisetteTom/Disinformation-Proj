import React, { useState } from "react";

function formatTweetContent(content) {
  if (!content) return "";

  // Remove t.co URLs
  const urlRegex = /https?:\/\/t\.co\/\w+/g;
  return content.replace(urlRegex, "");
}

// Normalize path to use forward slashes instead of backslashes
const normalizePath = (path) => {
  if (!path) return "";
  return path.replace(/\\/g, "/");
};

// Extract tweet ID from a media path or filename
const extractTweetId = (path) => {
  if (!path) return null;
  const tweetMatch = path.match(/tweet_(\d+)_media/);
  if (tweetMatch && tweetMatch[1]) {
    return tweetMatch[1];
  }
  return null;
};

// New improved getProfilePicSrc function
// New improved getProfilePicSrc function
const getProfilePicSrc = (profilePic) => {
  if (!profilePic) return null;

  // Normalize to forward slashes
  profilePic = normalizePath(profilePic);

  // For GCP paths with gs:// prefix
  if (profilePic.startsWith("gs://")) {
    // Convert gs:// URL to direct GCP URL - this works once CORS is properly set
    const gsPath = profilePic.replace("gs://", "");
    const [bucketName, ...pathParts] = gsPath.split("/");
    const pathString = pathParts.join("/");

    // Use direct approach via Vite proxy instead of CORS
    // Route through Vite's proxy to avoid CORS issues
    return `/api/media/profiles/direct?bucket=${bucketName}&path=${encodeURIComponent(pathString)}`;
  }

  // Handle other cases
  if (profilePic.startsWith("http")) {
    return profilePic;
  } else if (profilePic.includes("profile_pics")) {
    const parts = profilePic.split("profile_pics/");
    if (parts.length > 1) {
      return `/api/media/profiles/simple?path=${encodeURIComponent(parts[1])}`;
    }
  }

  // Basic path
  return `/api/media/profiles/simple?path=${encodeURIComponent(profilePic)}`;
};

// New improved getMediaSrc function
const getMediaSrc = (media) => {
  if (!media) return null;

  // Normalize to forward slashes
  media = normalizePath(media);

  // For GCP storage paths, use direct-gcp endpoint
  if (media.startsWith("gs://")) {
    const gsPath = media.replace("gs://", "");
    const [bucketName, ...pathParts] = gsPath.split("/");
    const objectPath = pathParts.join("/");

    // Direct GCP access is more reliable
    return `http://localhost:3001/api/media/direct-gcp?bucket=${bucketName}&path=${encodeURIComponent(objectPath)}`;
  }

  // Extract tweet ID if present in the media path
  const tweetId = extractTweetId(media);

  // Handle different media path formats
  if (media.startsWith("http")) {
    return media;
  } else if (tweetId) {
    // If we have a tweet ID, use the proper GCP path structure
    const mediaName = media.split("/").pop();
    return `http://localhost:3001/api/media/direct-gcp?bucket=disinformation-game-images&path=${encodeURIComponent(`media/${tweetId}/${mediaName}`)}`;
  } else if (media.includes("downloaded_images")) {
    // Handle Windows path format for downloaded_images
    const parts = media.split("downloaded_images/");
    if (parts.length > 1) {
      const nestedPath = parts[1];
      // Use the exact path structure you confirmed works in GCP
      const tweetMatch = nestedPath.match(/.*?(tweet_\d+_media_\d+\.jpg)$/i);
      if (tweetMatch && tweetMatch[1]) {
        // Extract the tweet ID from the filename
        const idMatch = tweetMatch[1].match(/tweet_(\d+)_media/);
        if (idMatch && idMatch[1]) {
          return `http://localhost:3001/api/media/direct-gcp?bucket=disinformation-game-images&path=${encodeURIComponent(`media/${idMatch[1]}/${tweetMatch[1]}`)}`;
        }
      }
      // Fallback to just the path
      return `http://localhost:3001/api/media/direct-gcp?bucket=disinformation-game-images&path=${encodeURIComponent(`media/${nestedPath}`)}`;
    }
  }

  // Basic path - with media/ prefix since that's the structure in GCP
  return `http://localhost:3001/api/media/direct-gcp?bucket=disinformation-game-images&path=${encodeURIComponent(`media/${media}`)}`;
};

function MessageCard({ message, onModerate, hideApproveButton, hideButtons, clickable, onClose, onClick, isExpanded }) {
  const [mediaLoaded, setMediaLoaded] = useState({});
  const [mediaErrors, setMediaErrors] = useState({});
  const [profileLoaded, setProfileLoaded] = useState(false);

  const mediaFiles = message.mediaFiles || [];
  // Split the mediaFiles string if it's not already an array
  const mediaFilesArray = Array.isArray(mediaFiles) ? mediaFiles : mediaFiles.split("|").filter(Boolean);

  // Inline SVG placeholders - these will always work
  const defaultAvatar = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#E5E7EB" />
    <path d="M16 8C13.791 8 12 9.791 12 12C12 14.209 13.791 16 16 16C18.209 16 20 14.209 20 12C20 9.791 18.209 8 16 8Z" fill="#9CA3AF" />
    <path d="M16 18C12.686 18 10 20.686 10 24H22C22 20.686 19.314 18 16 18Z" fill="#9CA3AF" />
  </svg>`;

  // Media placeholder - using data URI to avoid network requests
  const mediaPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M65,45 L65,40 L60,40 L60,35 L40,35 L40,40 L35,40 L35,45 L30,45 L30,65 L70,65 L70,45 L65,45 Z M45,40 L55,40 L55,45 L45,45 L45,40 Z M65,60 L35,60 L35,50 L40,50 L40,55 L60,55 L60,50 L65,50 L65,60 Z' fill='%23d1d5db'/%3E%3C/svg%3E";

  const renderProfilePicture = () => {
    if (!message.profilePic) return <div dangerouslySetInnerHTML={{ __html: defaultAvatar }} />;

    const profileSrc = getProfilePicSrc(message.profilePic);

    return (
      <div className="relative h-8 w-8 overflow-hidden rounded-full">
        {!profileLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div dangerouslySetInnerHTML={{ __html: defaultAvatar }} />
          </div>
        )}
        <img
          src={profileSrc}
          alt={`@${message.author} profile`}
          className={`h-full w-full object-cover ${profileLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setProfileLoaded(true)}
          onError={(e) => {
            console.log("Profile image failed to load:", profileSrc);
            e.target.style.display = "none";
            // Keep the default avatar visible
          }}
        />
      </div>
    );
  };

  const renderMediaItem = (media, index) => {
    // Get the optimized source URL
    const imgSrc = getMediaSrc(media);
    const hasError = mediaErrors[index];
    const isLoaded = mediaLoaded[index];

    return (
      <div key={index} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-gray-100">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={mediaPlaceholder} alt="Media placeholder" className="h-full w-full object-contain" />
          </div>
        )}

        <img
          src={imgSrc}
          alt={`Media ${index}`}
          className={`h-full w-full object-cover ${isLoaded && !hasError ? "opacity-100" : "opacity-0"}`}
          onLoad={() => {
            setMediaLoaded((prev) => ({ ...prev, [index]: true }));
          }}
          onError={(e) => {
            console.log(`Media ${index} failed to load: ${imgSrc}`);

            // Attempt to try a backup URL for GS URLs
            if (imgSrc.includes("direct-gcp") && !mediaErrors[index]) {
              // Try the old approach as a fallback
              const backupSrc = `/api/media/images?path=${encodeURIComponent(media)}`;
              console.log(`Trying backup source: ${backupSrc}`);
              e.target.src = backupSrc;

              // Mark this as having one error already
              setMediaErrors((prev) => ({ ...prev, [index]: "attempt1" }));
            } else {
              // If we've already tried a backup or this isn't a GCP URL, mark as error
              setMediaErrors((prev) => ({ ...prev, [index]: "failed" }));
              e.target.style.display = "none";
            }
          }}
        />
      </div>
    );
  };

  // Only updating the return part of the component

  return (
    <div 
      className={`rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition-all duration-300 
        ${clickable ? "cursor-pointer hover:bg-blue-50 hover:shadow-md" : ""} 
        ${isExpanded ? "shadow-lg border-blue-300" : ""}`} 
      onClick={onClick ? onClick : undefined}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-2">{renderProfilePicture()}</div>
          <div>
            <span className="font-bold text-gray-800">@{message.author}</span>
            <div className="text-xs text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified Account
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message.timestamp instanceof Date && !isNaN(message.timestamp) ? message.timestamp.toLocaleString() : "Unknown date"}
        </div>
      </div>

      <div className="mb-4 py-2 text-gray-800" dangerouslySetInnerHTML={{ __html: formatTweetContent(message.content) }} />

      {mediaFilesArray.length > 0 && 
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg overflow-hidden border border-blue-100">
          {mediaFilesArray.map((media, index) => renderMediaItem(media, index))}
        </div>
      }

      <div className="mt-3 flex gap-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {message.likes || 0}
        </span>
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {message.shares || 0}
        </span>
      </div>

      {!hideButtons && (
        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {!hideApproveButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
              className="rounded bg-green-600 px-3 py-1 text-white transition hover:bg-green-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onModerate(message.id, "flag");
            }}
            className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Intox
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onModerate(message.id, "factcheck");
            }}
            className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Fact Check
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageCard;