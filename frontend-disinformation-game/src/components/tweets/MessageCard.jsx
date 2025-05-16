import React, { useEffect, useState } from "react";

function formatTweetContent(content) {
  if (!content) return "";

  // remove les t.co URLs
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

const getMediaSrc = (media) => {
  if (!media) return null;

  // Normalize to forward slashes
  media = normalizePath(media);

  // Extract tweet ID from filename (this is key for your structure)
  const tweetIdMatch = media.match(/tweet_(\d+)_media/);
  const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

  // Get just the filename
  const fileName = media.split("/").pop();

  // If we have a tweet ID and filename, use the confirmed working structure
  if (tweetId && fileName) {
    return `/api/media/images?path=media/${tweetId}/${fileName}`;
  }

  // If it's a full URL, use it directly
  if (media.startsWith("http")) {
    return media;
  }

  // For GCP storage paths
  if (media.startsWith("gs://")) {
    return `/api/media/images?path=${encodeURIComponent(media)}`;
  }

  // Last resort - try to extract the filename if it has the tweet_ pattern
  if (media.includes("tweet_") && fileName) {
    return `/api/debug/test-stream-image?path=${encodeURIComponent(fileName)}`;
  }

  // Fallback to just the media path
  return `/api/media/images?path=${encodeURIComponent(media)}`;
};

function MessageCard({ message, onModerate, hideApproveButton, hideButtons, clickable, onClose }) {
  const [mediaLoaded, setMediaLoaded] = useState({});
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

  const getProfilePicSrc = (profilePic) => {
    if (!profilePic) return null;

    // Normalize to forward slashes
    profilePic = normalizePath(profilePic);

    // Check for different profile path formats
    if (profilePic.startsWith("http")) {
      return profilePic;
    } else if (profilePic.startsWith("gs://")) {
      return `/api/media/profiles?path=${encodeURIComponent(profilePic)}`;
    } else if (profilePic.includes("profile_pics")) {
      // Handle paths containing profile_pics folder
      const parts = profilePic.split("profile_pics/");
      if (parts.length > 1) {
        return `/api/media/profiles?path=${encodeURIComponent(parts[1])}`;
      }
    } else if (profilePic.includes("/")) {
      // If it has slashes but isn't a full path, try with users/ prefix
      const withPrefix = `/api/media/profiles?path=users/${encodeURIComponent(profilePic)}`;
      return withPrefix;
    }

    // Basic path - just encode it
    return `/api/media/profiles?path=${encodeURIComponent(profilePic)}`;
  };

  const getMediaSrc = (media) => {
    if (!media) return null;

    // Normalize to forward slashes
    media = normalizePath(media);

    // Extract tweet ID if present in the media path
    const tweetId = extractTweetId(media);

    // Handle different media path formats
    if (media.startsWith("http")) {
      return media;
    } else if (media.startsWith("gs://")) {
      return `/api/media/images?path=${encodeURIComponent(media)}`;
    } else if (tweetId) {
      // If we have a tweet ID, use the proper GCP path structure
      const mediaName = media.split("/").pop();
      return `/api/media/images?path=media/${tweetId}/${encodeURIComponent(mediaName)}`;
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
            return `/api/media/images?path=media/${idMatch[1]}/${encodeURIComponent(tweetMatch[1])}`;
          }
        }
        // Fallback to just the path
        return `/api/media/images?path=media/${encodeURIComponent(nestedPath)}`;
      }
    }

    // Basic path - with media/ prefix since that's the structure in GCP
    return `/api/media/images?path=media/${encodeURIComponent(media)}`;
  };

  const renderProfilePicture = () => {
    if (!message.profilePic) return <div dangerouslySetInnerHTML={{ __html: defaultAvatar }} />;

    const profileSrc = getProfilePicSrc(message.profilePic);

    return (
      <img
        src={profileSrc}
        alt={`@${message.author} profile`}
        className="h-8 w-8 rounded-full object-cover"
        onLoad={() => setProfileLoaded(true)}
        onError={(e) => {
          e.target.onerror = null; // Prevent error loop
          if (e.target.parentNode) {
            try {
              // Replace with the SVG
              const container = e.target.parentNode;
              if (container) {
                container.innerHTML = "";
                const svgElement = document.createElement("div");
                svgElement.innerHTML = defaultAvatar;
                container.appendChild(svgElement.firstChild);
              }
            } catch (err) {
              console.error("Error replacing profile image with SVG:", err);
            }
          }
        }}
      />
    );
  };

  return (
    <div className={`rounded-lg border border-gray-300 bg-white p-4 shadow-sm ${clickable ? "cursor-pointer hover:bg-gray-50" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-2 h-8 w-8 overflow-hidden rounded-full">{renderProfilePicture()}</div>
          <span className="font-bold text-gray-800">@{message.author}</span>
        </div>
        <span className="text-sm text-gray-500">{message.timestamp instanceof Date && !isNaN(message.timestamp) ? message.timestamp.toLocaleString() : "Unknown date"}</span>
      </div>

      <div className="mb-4 py-2 text-gray-800" dangerouslySetInnerHTML={{ __html: formatTweetContent(message.content) }} />

      {/* Display media files if available */}
      {mediaFilesArray.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {mediaFilesArray.map((media, index) => {
            // Get the initial source URL
            const imgSrc = getMediaSrc(media);

            return (
              <div key={index} className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-gray-100">
                <img
                  src={imgSrc}
                  alt={`Media ${index}`}
                  className="h-full w-full object-cover"
                  data-attempts="0"
                  onLoad={() => {
                    setMediaLoaded((prev) => ({ ...prev, [index]: true }));
                  }}
                  // Update the onError handler to avoid direct GCP URLs:

                  onError={(e) => {
                    // Track attempts to prevent infinite loops
                    const attempts = parseInt(e.target.dataset.attempts || "0") + 1;
                    e.target.dataset.attempts = attempts.toString();

                    console.log(`Media ${index} failed to load (attempt ${attempts}): ${imgSrc}`);

                    // Only try alternate approaches if we haven't tried too many times
                    if (attempts < 3) {
                      try {
                        // Always normalize the media path first
                        const normalizedMedia = normalizePath(media);

                        // Extract just the filename (without any directory parts)
                        const fileName = normalizedMedia.split("/").pop();

                        // Make sure there are no backslashes in the filename
                        const cleanFileName = fileName.replace(/\\/g, "");

                        // Try to extract tweet ID from filename
                        const tweetIdMatch = cleanFileName.match(/tweet_(\d+)_media/);
                        const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

                        let altSrc;

                        if (attempts === 1) {
                          // First attempt: Direct tweet ID + filename approach
                          if (tweetId) {
                            altSrc = `/api/media/images?path=media/${tweetId}/${encodeURIComponent(cleanFileName)}`;
                          } else {
                            // Try just the filename if no tweet ID
                            altSrc = `/api/media/images?path=${encodeURIComponent(cleanFileName)}`;
                          }
                        } else {
                          // Second attempt: Directly use test-stream-image endpoint which works
                          if (tweetId) {
                            altSrc = `/api/debug/test-stream-image?path=media/${tweetId}/${encodeURIComponent(cleanFileName)}`;
                          } else {
                            altSrc = `/api/debug/test-stream-image?path=${encodeURIComponent(cleanFileName)}`;
                          }
                        }

                        console.log(`Trying alternate source: ${altSrc}`);
                        e.target.onerror = null;
                        e.target.src = altSrc;
                      } catch (err) {
                        console.error("Error creating alternate URL:", err);
                        e.target.onerror = null;
                        e.target.src = mediaPlaceholder;
                      }
                    } else {
                      // Too many attempts, use placeholder
                      console.log("Using placeholder after multiple failed attempts");
                      e.target.onerror = null;
                      e.target.src = mediaPlaceholder;
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex gap-4 text-sm text-gray-600">
        <span>❤️ {message.likes || 0}</span>
        <span>🔄 {message.shares || 0}</span>
      </div>

      {/* Only show buttons if not explicitly hidden */}
      {!hideButtons && (
        <div className="flex flex-wrap gap-2">
          {!hideApproveButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Just close the modal when Approve is clicked
                if (onClose) onClose();
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
