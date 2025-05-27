import { getAuthToken } from "./authService";

/**
 * Fetch tweets from the backend API
 * @returns {Promise<Array>} The fetched tweets
 * @throws {Error} If the API request fails
 */
export async function fetchTweets(hashtag = null) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("You must be logged in to access the moderation panel");
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
    throw new Error(`API returned status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Fetch hashtag statistics
 * @returns {Promise<Array>} Array of hashtag objects with counts
 * @throws {Error} If the API request fails
 */
export async function fetchHashtagStats() {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("You must be logged in to access hashtag statistics");
  }
  
  const response = await fetch("http://localhost:3001/api/protected/hashtag-stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API returned status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Update the classification of a tweet
 * @param {string} tweetId - The ID of the tweet to classify
 * @param {boolean} isDisinfo - Whether the tweet is disinformation
 * @returns {Promise<Object>} The response data
 * @throws {Error} If the API request fails
 */
export async function classifyTweet(tweetId, isDisinfo) {
  const token = await getAuthToken();
  
  const response = await fetch("http://localhost:3001/api/protected/classify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tweetId,
      isDisinfo,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update classification");
  }
  
  return await response.json();
}

/**
 * Delete a tweet
 * @param {string} tweetId - The ID of the tweet to delete
 * @returns {Promise<Object>} The response data
 * @throws {Error} If the API request fails
 */
export async function deleteTweet(tweetId) {
  const token = await getAuthToken();
  
  const response = await fetch("http://localhost:3001/api/protected/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tweetId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete tweet");
  }
  
  return await response.json();
}