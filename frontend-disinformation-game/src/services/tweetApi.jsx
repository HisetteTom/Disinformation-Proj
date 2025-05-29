import { getAuthToken } from "./authService";

// fetchTweets function to retrieve tweets based on a hashtag
export const fetchTweets = async (hashtag = null) => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }
  
  let url = "http://localhost:3001/api/protected/tweets";
  if (hashtag) {
    url += `?hashtag=${encodeURIComponent(hashtag)}`;
  }
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch tweets");
  }
  
  return await response.json();
};

// fetchHashtagStats function to retrieve statistics for a specific hashtag
export const fetchHashtagStats = async () => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }
  
  const response = await fetch("http://localhost:3001/api/protected/hashtag-stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch hashtag stats");
  }
  
  return await response.json();
};