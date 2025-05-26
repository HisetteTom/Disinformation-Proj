import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Register a new user
export const register = async (email, password, username) => {
  try {
    // First create the user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name for the user
    await updateProfile(userCredential.user, {
      displayName: username,
    });

    // Get token for backend authentication
    const token = await userCredential.user.getIdToken();

    // Call backend to store additional user info
    const response = await fetch("http://localhost:3001/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        email,
        password, // The backend will ignore this since Firebase already handles auth
      }),
    });

    if (!response.ok) {
      // If the backend registration fails, delete the Firebase user
      try {
        await userCredential.user.delete();
      } catch (deleteError) {
        console.error("Error cleaning up user after failed registration:", deleteError);
      }
      throw new Error("Registration failed on server");
    }

    return userCredential.user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Get auth token
export const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

// Subscribe to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const updateUserStats = async (stats) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch("http://localhost:3001/api/users/stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stats: stats, // Wrap stats in an object with "stats" property
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating stats:", error);
    throw error;
  }
};

export const updateUserUpgrades = async (money, upgrades) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch("http://localhost:3001/api/protected/upgrades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        money,
        upgrades,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update upgrades");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating upgrades:", error);
    throw error;
  }
};

/**
 * Save correctly answered tweets for a user
 * @param {string} userId - User ID
 * @param {Array} tweetIds - Array of tweet IDs correctly answered
 * @returns {Promise<Object>} - Response data
 */
export const saveCorrectlyAnsweredTweets = async (tweetIds) => {
  try {
    console.log("Attempting to save tweet IDs:", tweetIds);
    const token = await getAuthToken();

    if (!token) {
      console.error("No auth token available - cannot save tweets");
      return;
    }

    console.log("Token available, sending request to backend");

    const response = await fetch("http://localhost:3001/api/protected/answered-tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tweetIds }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      throw new Error("Failed to save answered tweets: " + response.status);
    }

    const result = await response.json();
    console.log("API response for saving tweets:", result);
    return result;
  } catch (error) {
    console.error("Error saving correctly answered tweets:", error);
    // Log the full error object for debugging
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
export function useGameActions(gameState, upgradeEffects, processedTweets, setProcessedTweets) {
  // Make sure user is properly destructured from gameState
  const { messageFeed, setMessageFeed, setCurrentMessage, setIsModalOpen, baseScore, setBaseScore, messagesHandled, setMessagesHandled, feedSpeed, gameOver, user, score } = gameState;
}


export const resetUserProfile = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch("http://localhost:3001/api/protected/reset-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to reset profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error resetting profile:", error);
    throw error;
  }
};