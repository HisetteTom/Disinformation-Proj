import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDdZKOBebV786PXXb1YB8GlCIZArUJZRR8",
  authDomain: "disinformation-game.firebaseapp.com",
  projectId: "disinformation-game",
  storageBucket: "disinformation-game.firebasestorage.app",
  messagingSenderId: "896801586624",
  appId: "1:896801586624:web:46072201d3bb75b6001c25",
  measurementId: "G-F3HLS9KQSL"
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
      displayName: username
    });
    
    // Get token for backend authentication
    const token = await userCredential.user.getIdToken();
    
    // Call backend to store additional user info
    const response = await fetch('http://localhost:3001/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username,
        email,
        password // The backend will ignore this since Firebase already handles auth
      })
    });
    
    if (!response.ok) {
      // If the backend registration fails, delete the Firebase user
      try {
        await userCredential.user.delete();
      } catch (deleteError) {
        console.error('Error cleaning up user after failed registration:', deleteError);
      }
      throw new Error('Registration failed on server');
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
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
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('http://localhost:3001/api/users/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stats: stats  // Wrap stats in an object with "stats" property
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating stats:', error);
      throw error;
    }
  };


export const updateUserUpgrades = async (money, upgrades) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('http://localhost:3001/api/protected/upgrades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          money,
          upgrades
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update upgrades');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating upgrades:', error);
      throw error;
    }
  };
